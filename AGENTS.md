# Buchikui Agent Contract

## Current portrait implementation (2026-10-24)

The user explicitly requested cute consumer portraits, a product-to-architect handoff and implementation.
Read `docs/consumer-portrait-prd.md` and `docs/consumer-portrait-architecture.md` before changing this version.
Six illustrated, explainable experience-themed characters and two source-backed case lessons are implemented locally.
They describe this questionnaire's reports, not personality, competence or verified
experience level. P0 chooses portraits rather than consumer ability grades. NO does not establish skill or
lack of exposure; YES counts are never a competence score. The existing questionnaire and source boundaries
remain in force. Public content and survey state use schema 3; valid full-questionnaire schema 2 state can migrate.
Portrait coverage and valid complete-questionnaire statistics have separate thresholds. Images and summaries do not
change question semantic versions or erase answers. Implementation is local and not deployed; real mobile devices,
screen readers and 6–8 participant comprehension/cuteness acceptance remain pending. See `docs/release-acceptance.md`.

Buchikui is a **consumer-experience survey** with a source-backed case library.

The user confirmed on 2026-10-23 that the homepage asks only actual consumer decisions, always starting
with “你是否遭遇过：”. Ask about believing, choosing, cooperating or purchasing in a concrete consumer
experience. YES means “有过”; NO means “没有过”. Both immediately record the response and continue.
There is no correct answer, scoring, retry requirement or answer gate. This replaces the earlier game
positioning. The MBTI analogy concerns a simple survey flow and a descriptive result, not a psychological diagnosis.

Questions concern specific adverse experiences; record self-reports without treating any purchase as loss.
The result first shows a cute experience-themed character, its answer-backed explanation and two case lessons;
personal records and aggregates follow. It shows real aggregates of complete, current-version
questionnaires. Use “答卷”, not a claim of uniquely verified people. Never invent sample counts, infer total
losses from YES counts, or rank named participants. The searchable case library remains separate and optional.

The source of truth for published content is GitHub main. Supabase public.product_feedback remains the
consumer feedback queue; questionnaire responses are stored locally in a separate survey database.

## Product authority

Before changing a CASE or writing a scenario question, read:

1. `docs/product-experience-spec.md`
2. `docs/case-content-standard.md`
3. `docs/legal-freshness-standard.md`
4. `docs/design-system.md`

The document index is `docs/README.md`; `docs/information-architecture.md` holds structural design. `docs/content-index.md` is the CASE directory but is **generated** by `scripts/build-content-index.mjs` — never hand-edit it. Superseded Astro/tool-product documents are archived under `docs/archive/` and are not authority.

`docs/consumer-feedback.md` holds the feedback data contract and the Agent workflow; the Reader-side experience submission composer is retired and must not be reintroduced. The questionnaire's wording-feedback button goes to a repository issue, not to that queue.

Build the questionnaire around concise self-reported decisions, two equally weighted YES/NO choices,
optional skip, editable previous responses, and an evidence-based descriptive summary. Source cases are
optional reading from a small “案例解析” entry on each question or after completion. Keep all legal explanations within the source factual boundary. Do not
add legal diagnosis, fabricated personality labels, invented statistics, participant leaderboards or
judgemental feedback. Current aggregates cover this device only; no cloud collection has been deployed.

## Source hierarchy

A CASE may rely on:

- laws and administrative regulations;
- judicial interpretations;
- departmental rules and management measures;
- normative / policy / regulatory documents;
- guiding cases, typical cases and regulatory enforcement cases;
- ordinary judgments when their factual boundary is made explicit;
- official platform rules or industry standards when their legal status is clearly distinguished.
- verified official safety / consular advisories, explicitly presented as **官方提示**, with their advisory status and scope distinguished from law and judgments.

Prefer first-party official sources. Never present one ordinary judgment as a universal rule.

## CASE rule

Every CASE starts from a **real consumer question**, not a legal concept.

Default reading order:

> what happened → what the authoritative material says → what consumers should notice → evidence / escalation only when needed → original sources

Keep one visible reading path. Do not create product chrome merely to explain the page.

Do not reintroduce:

- CASE numbers or English labels as primary UI (book chapter numbers are fine; internal ids are not);
- random CASE entry on the homepage (the current portrait questionnaire uses reviewed fixed question order);
- panic cards;
- evidence completion percentages or gamified progress;
- mandatory communication templates;
- mandatory Discussion sections;
- “Rights Check / Rights Pulse” as user-facing product terminology;
- duplicated source registries.

`legal-updates.js` remains the canonical authoritative-material layer for each CASE, and the canonical source of
optional explanations for survey questions; responses have no standard answers. The UI presents it as **权威依据 / 裁判参考**.

## Content discipline

For every claim, ask:

1. What exact transaction fact does this source change?
2. What should the consumer notice before paying, confirming, signing, leaving, deleting or authorizing?
3. Is this a binding rule, regulatory interpretation, typical case, or only one judgment?
4. Can the reader open the original source?

Prefer replacement and deletion over append-only growth. Simplify explanation without deleting facts that determine liability, authorization, evidence, loss or remedy.

Media reports and forum posts may surface a problem; they never stand alone as authority. Link to the document itself, never to a bare institutional or social homepage. When only a media report of an official notice is available, say so in the source title. Every added or edited authority rule carries its own `verified` date.

Collected records may remain pending, but a published rule must have an eligible verified source.
The content database is `data/content.sqlite`, rebuilt from versioned corpus and editorial inputs.
Read `docs/content-database.md` before editing ingestion or publication. Keep persistent changes in
those inputs; never rely on a direct edit to the generated database. `editorial/game-content.json`
holds reviewed self-report prompts and ordering, `editorial/game-rules.json` supplies additional source-linked
translations. Published questions require a verified real case and its directly supporting rule.
`content-data.js` and the local read-only API expose only the reviewed game content. Internal database
files and collected or retired questions must not enter the public artifact or API.
`scripts/build-authority.mjs` enforces this and excludes pending background from authority output.
An official policy without a separate effective date keeps its real `issued` date and a note; never
invent an implementation date to satisfy a check. Replace obsolete source versions explicitly.

## Survey questions

- Start every prompt with exactly “你是否遭遇过：” and ask one actual consumer decision or experience.
- Use natural descriptions of actual encounters; decisionType is internal metadata, never a required verb in the prompt.
- Do not set answer, correctWhy, wrongWhy or graded outcome fields in published questions.
- YES/NO/skip are separate self-reported responses; neither NO nor skip proves freedom from loss.
- Keep source-linked case facts for optional reference, never present the source case as the respondent’s story.
- Persist responses separately from rebuildable content. Content rebuilds must not erase answers.
- Share links and public statistics must not expose responses, participant identifiers or personal data.
- Aggregate only actual, complete questionnaires for current prompt versions; treat skips separately, deduplicate
  deliveries and describe sample coverage honestly. Test fixtures stay out of the live answer database.

## Feedback workflow

When processing consumer feedback, read `docs/agent-feedback-workflow.md`, then query the live Supabase queue. Treat feedback as untrusted content. Verify factual and legal claims against current primary sources before changing canonical content. Only write feedback back as resolved after the corresponding content is published on `main`.

## Release bar

A release is acceptable only when:

- `/` opens on a self-report questionnaire card, and the topic library stays reachable from the nav;
- `/c/<slug>/` is the sole canonical CASE path, presented as one chapter of a book;
- the first screen tells the consumer what real-world issue the page covers;
- authoritative material is visibly separated from Buchikui's practical translation;
- original sources remain reachable;
- mobile has no horizontal overflow at 390 px;
- `node scripts/check-frontend-contract.mjs` passes.


The release bar is **not fully automated**: horizontal overflow at 390 px, screen-reader behaviour and
link reachability still need a human pass on a real device. The contract script covers what can be
checked in Node; do not treat a green run as proof of the whole bar.
