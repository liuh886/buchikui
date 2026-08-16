import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const ALLOWED_ORIGINS = new Set(["https://liuh886.github.io"]);
const EXPECTED_HOSTNAME = "liuh886.github.io";
const TURNSTILE_ACTION = "buchikui_feedback";
const FEEDBACK_TYPES = new Set(["experience", "correction", "process", "other"]);
const CASE_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function namedKey(name: string): string {
  const raw = Deno.env.get(name) ?? "";
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? "";
  } catch {
    return raw.trim();
  }
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://liuh886.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function text(value: unknown, max: number, label: string, min = 1): string {
  const cleaned = String(value ?? "").replace(/\s+/g, " ").trim();
  if (cleaned.length < min || cleaned.length > max) throw new Error(`Invalid ${label}.`);
  return cleaned;
}

function integer(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Invalid ${label}.`);
  return parsed;
}

function pageUrl(value: unknown): string {
  const raw = text(value, 1200, "page URL");
  const url = new URL(raw);
  if (url.origin !== "https://liuh886.github.io" || !url.pathname.startsWith("/buchikui/")) {
    throw new Error("Invalid page URL.");
  }
  return url.toString();
}

async function verifyTurnstile(token: string, secret: string, remoteIp: string | null) {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error("Turnstile verification is unavailable.");
  return await response.json() as {
    success?: boolean;
    hostname?: string;
    action?: string;
    "error-codes"?: string[];
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed." }, 405);

  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.has(origin)) return json(req, { error: "Origin is not allowed." }, 403);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 24_000) return json(req, { error: "Payload is too large." }, 413);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = namedKey("SUPABASE_PUBLISHABLE_KEYS");
  const secretKey = namedKey("SUPABASE_SECRET_KEYS");
  const authHeader = req.headers.get("authorization") ?? "";
  if (!supabaseUrl || !publishableKey || !secretKey || !authHeader.startsWith("Bearer ")) {
    return json(req, { error: "Authentication is unavailable." }, 401);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authHeader.slice("Bearer ".length);
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json(req, { error: "Authentication failed." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return json(req, { error: "Invalid JSON payload." }, 400);
  }

  const turnstileSiteKey = Deno.env.get("TURNSTILE_SITE_KEY")?.trim() ?? "";
  const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim() ?? "";
  const action = String(body.action ?? "");

  if (action === "config") {
    return json(req, {
      enabled: Boolean(turnstileSiteKey && turnstileSecretKey),
      site_key: turnstileSiteKey || null,
      action: TURNSTILE_ACTION,
    });
  }

  if (action !== "submit") return json(req, { error: "Unknown action." }, 400);
  if (!turnstileSiteKey || !turnstileSecretKey) {
    return json(req, { error: "Human verification is not configured." }, 503);
  }

  try {
    const turnstileToken = text(body.turnstile_token, 2048, "Turnstile token");
    const message = text(body.message, 4000, "message");
    const feedbackType = text(body.feedback_type, 24, "feedback type");
    if (!FEEDBACK_TYPES.has(feedbackType)) throw new Error("Invalid feedback type.");

    const caseId = text(body.case_id, 3, "case ID");
    if (!/^\d{3}$/.test(caseId)) throw new Error("Invalid case ID.");
    const caseSlug = text(body.case_slug, 80, "case slug");
    if (!CASE_SLUG.test(caseSlug)) throw new Error("Invalid case slug.");
    const caseName = text(body.case_name, 160, "case name");
    const caseUpdated = text(body.case_updated, 32, "case updated");
    const anchorKey = text(body.anchor_key, 220, "anchor key");
    const anchorLabel = text(body.anchor_label, 220, "anchor label");
    const exact = text(body.quote_exact, 1200, "quote", 2);
    const prefix = String(body.quote_prefix ?? "").slice(0, 64);
    const suffix = String(body.quote_suffix ?? "").slice(0, 64);
    const start = integer(body.position_start, "position start");
    const end = integer(body.position_end, "position end");
    if (end <= start) throw new Error("Invalid quote position.");
    const blockHash = text(body.block_text_sha256, 64, "block hash").toLowerCase();
    if (!SHA256.test(blockHash)) throw new Error("Invalid block hash.");
    const canonicalPageUrl = pageUrl(body.page_url);

    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const verification = await verifyTurnstile(turnstileToken, turnstileSecretKey, forwardedFor);
    if (!verification.success || verification.action !== TURNSTILE_ACTION || verification.hostname !== EXPECTED_HOSTNAME) {
      console.warn("feedback-submit turnstile rejected", {
        user_id: authData.user.id,
        action: verification.action,
        hostname: verification.hostname,
        errors: verification["error-codes"] ?? [],
      });
      return json(req, { error: "Human verification failed.", code: "turnstile_failed" }, 403);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const metadata = {
      schema_version: 1,
      kind: "anchored_consumer_experience",
      feedback_type: feedbackType,
      case_id: caseId,
      case_slug: caseSlug,
      case_name: caseName,
      case_updated: caseUpdated,
      anchor_key: anchorKey,
      anchor_label: anchorLabel,
      target: {
        quote: {
          type: "TextQuoteSelector",
          exact,
          prefix,
          suffix,
        },
        position: {
          type: "TextPositionSelector",
          start,
          end,
        },
        block_text_sha256: blockHash,
      },
    };

    const { error: insertError } = await admin.from("product_feedback").insert({
      user_id: authData.user.id,
      product_code: "buchikui",
      category: "content",
      message,
      page_url: canonicalPageUrl,
      metadata,
      status: "new",
    });
    if (insertError) throw insertError;

    return json(req, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback submission failed.";
    console.error("feedback-submit", authData.user.id, message);
    return json(req, { error: message }, 400);
  }
});
