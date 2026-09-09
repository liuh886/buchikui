import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const ALLOWED_ORIGIN = "https://liuh886.github.io";
const FEEDBACK_TYPES = new Set(["experience", "correction", "process", "other"]);
const CASE_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SHA256 = /^[a-f0-9]{64}$/;
// 与共享 Hao Account 壳复用同一 Cloudflare Turnstile widget；sitekey 公开，secret 只活在 Function Secret。
const TURNSTILE_ACTION = "buchikui_feedback";
const TURNSTILE_HOSTNAME = "liuh886.github.io";
const TURNSTILE_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

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
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
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
  if (url.origin !== ALLOWED_ORIGIN || !url.pathname.startsWith("/buchikui/")) {
    throw new Error("Invalid page URL.");
  }
  return url.toString();
}

function turnstileSecret(): string {
  const raw = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
  return raw.trim();
}

function turnstileSitekey(): string {
  const raw = Deno.env.get("TURNSTILE_SITE_KEY") ?? "";
  return raw.trim();
}

async function verifyTurnstile(token: string, remoteIp: string | null): Promise<void> {
  const secret = turnstileSecret();
  // fail closed：secret 缺失时直接拒绝，绝不降级放行。
  if (!secret) throw new Error("Human verification is unavailable.");
  const cleaned = String(token ?? "").trim();
  if (!cleaned || cleaned.length > 2048) throw new Error("Human verification is required.");
  const form = new URLSearchParams({ secret, response: cleaned });
  if (remoteIp) form.set("remoteip", remoteIp);
  let verdict: { success?: boolean; action?: string; hostname?: string };
  try {
    const response = await fetch(TURNSTILE_SITEVERIFY, { method: "POST", body: form });
    verdict = await response.json() as { success?: boolean; action?: string; hostname?: string };
  } catch {
    throw new Error("Human verification failed.");
  }
  if (verdict.success !== true) throw new Error("Human verification failed.");
  if (verdict.action !== TURNSTILE_ACTION) throw new Error("Human verification failed.");
  if (verdict.hostname !== TURNSTILE_HOSTNAME) throw new Error("Human verification failed.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed." }, 405);

  const origin = req.headers.get("origin") ?? "";
  if (origin !== ALLOWED_ORIGIN) return json(req, { error: "Origin is not allowed." }, 403);

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

  if (String(body.action ?? "") !== "submit" && String(body.action ?? "") !== "config") {
    return json(req, { error: "Unknown action." }, 400);
  }

  // config：前端探测 Turnstile 是否就绪并获取公开 sitekey；同样需要登录。
  if (String(body.action ?? "") === "config") {
    const sitekey = turnstileSitekey();
    const configured = Boolean(sitekey && turnstileSecret());
    return json(req, { ok: true, turnstile: { sitekey, configured } });
  }

  try {
    const message = text(body.message, 4000, "message");
    const turnstileToken = text(body.turnstile_token, 2048, "human verification token", 1);
    await verifyTurnstile(turnstileToken, req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for"));
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
