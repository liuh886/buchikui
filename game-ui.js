(function (global) {
  'use strict';

  const STORAGE_KEY = 'buchikui-daily-v1';
  const ISSUE_BASE = 'https://github.com/ZOZN109/buchikui/issues/new';

  const ROLE_COLORS = {
    warmup: 'role-warmup',
    'spot-trap': 'role-spot',
    'positive-surprise': 'role-positive',
    hard: 'role-hard',
    boss: 'role-boss'
  };

  function R() {
    return global.BuchikuiRender || {
      esc: (s) => String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])),
      safeHref: (u) => (/^(https?:\/\/|\.\/|\/)/i.test(String(u || '')) ? String(u) : '#')
    };
  }

  function G() {
    return global.BuchikuiGame;
  }

  function loadStore() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, runs: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.runs !== 'object') {
        return { version: 1, runs: {}, corrupted: true };
      }
      return { version: 1, runs: parsed.runs };
    } catch (_err) {
      return { version: 1, runs: {}, corrupted: true };
    }
  }

  function saveRun(storageId, run) {
    try {
      const store = loadStore();
      const nextRuns = store.runs && typeof store.runs === 'object' ? { ...store.runs } : {};
      nextRuns[storageId] = run;
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, runs: nextRuns }));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function clearSavedStore() {
    try {
      global.localStorage.removeItem(STORAGE_KEY);
    } catch (_err) {
      // Ignore storage errors in restricted browsing modes
    }
  }

  function hasSaved() {
    const store = loadStore();
    return Boolean(store.runs && Object.keys(store.runs).length > 0);
  }

  function buildChallengeUrl(base, packId) {
    try {
      const url = new URL(base || './', global.location.href);
      url.search = `?pack=${encodeURIComponent(packId)}&challenge=1`;
      url.hash = '';
      return url.toString();
    } catch (_err) {
      return `${base || './'}?pack=${encodeURIComponent(packId)}&challenge=1`;
    }
  }

  function buildClueIssueUrl(packTitle) {
    const title = `[消费线索投稿] 来自 ${packTitle || '每日 5 关'}`;
    const body = [
      '请描述一个真实消费场景（进入正式关卡前需由编辑补齐官方依据或实测信息，不会直接上线未经核验内容）：',
      '',
      '1. 消费场景 / 商品或服务：',
      '2. 消费者下单前肉眼可见的线索：',
      '3. 你当时做的决定（买 / 不买）及原因：',
      '4. 已知官方规则 / 消协实测 / 收费公告链接（如有）：'
    ].join('\n');
    return `${ISSUE_BASE}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function buildFeedbackIssueUrl(pack, level) {
    const title = `[题目勘误] ${pack?.id || ''} ${level?.id || ''}`.trim();
    const body = `关卡：${level?.productSnapshot?.title || ''}\n问题描述：\n参考来源：`;
    return `${ISSUE_BASE}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function renderPips(pack, run, viewingIndex) {
    const { esc } = R();
    const levels = Array.isArray(pack?.levels) ? pack.levels : [];
    const byId = new Map((run.records || []).map((rec) => [rec.levelId, rec]));

    return `<ol class="daily-pips" aria-label="本局 5 关进度">${levels.map((lvl, idx) => {
      const rec = byId.get(lvl.id);
      let stateClass = 'is-upcoming';
      let label = `第 ${idx + 1} 关：未作答`;
      let mark = String(idx + 1);
      if (rec) {
        stateClass = rec.correct ? 'is-hit' : 'is-miss';
        label = `第 ${idx + 1} 关：${rec.correct ? '判断命中' : '差一点'}`;
        mark = rec.correct ? '✓' : '×';
      } else if (idx === run.activeIndex && run.status !== 'completed') {
        stateClass = 'is-current';
        label = `第 ${idx + 1} 关：当前关卡`;
      }
      const isViewing = idx === viewingIndex && run.status !== 'completed';
      const clickable = Boolean(rec) || (idx === run.activeIndex && run.status !== 'completed');
      if (clickable) {
        return `<li class="daily-pip ${stateClass}${isViewing ? ' is-viewing' : ''}"><button type="button" class="daily-pip-btn" data-pip-index="${idx}" aria-label="${esc(label)}"${isViewing ? ' aria-current="step"' : ''}>${esc(mark)}</button></li>`;
      }
      return `<li class="daily-pip ${stateClass}"><span class="daily-pip-dot" aria-label="${esc(label)}">${esc(mark)}</span></li>`;
    }).join('')}</ol>`;
  }

  function renderSourcesList(sources, caseSlug, base) {
    const { esc, safeHref } = R();
    const items = (sources || []).map((src) => {
      const meta = [src.label, src.issuer, src.locator].filter(Boolean).join(' · ');
      const dateMeta = [src.date ? `发布 ${src.date}` : '', src.verified ? `核验 ${src.verified}` : ''].filter(Boolean).join(' · ');
      return `<li class="daily-source-item">
        <a class="daily-source-link" href="${esc(safeHref(src.href))}" target="_blank" rel="noopener noreferrer">${esc(src.title)}</a>
        ${meta ? `<span class="daily-source-meta">${esc(meta)}</span>` : ''}
        ${dateMeta ? `<span class="daily-source-meta">${esc(dateMeta)}</span>` : ''}
      </li>`;
    }).join('');

    const caseLink = caseSlug
      ? `<a class="daily-case-link" href="${esc(base)}c/${esc(caseSlug)}/">阅读完整案例档案 →</a>`
      : '';

    return `<div class="daily-evidence-sources">
      <h4>官方依据与实测来源</h4>
      ${items ? `<ul class="daily-source-list">${items}</ul>` : '<p class="daily-source-empty">当前依据可在关联案例档案中查阅。</p>'}
      ${caseLink}
    </div>`;
  }

  function renderFallbackScreen(app, resolved, base, reasonText, onReset) {
    const { esc } = R();
    const isPaused = resolved && resolved.status === 'paused-source-invalid';
    const title = isPaused ? '本期关卡正在补充依据核验' : '暂时找不到你打开的那期关卡';
    const desc = reasonText || (isPaused
      ? '有来源或核验日期尚未通过发布闸门，为保证不误导你，当前暂停开放。'
      : '可能是期号不存在或链接参数有误，你可以回到今日 5 关或先看案例库。');

    app.innerHTML = `<section class="shell daily-shell daily-fallback" aria-labelledby="dailyFallbackTitle">
      <div class="daily-fallback-card">
        <p class="daily-eyebrow">不吃亏 · 每日 5 关</p>
        <h1 id="dailyFallbackTitle">${esc(title)}</h1>
        <p class="daily-fallback-copy">${esc(desc)}</p>
        <div class="daily-fallback-actions">
          <a class="daily-btn daily-btn-primary" href="${esc(base)}">回到今日 5 关</a>
          <a class="daily-btn" href="${esc(base)}?view=library">浏览案例库</a>
          ${onReset ? '<button type="button" class="daily-btn" data-action="clear-corrupt">重置本地异常存档</button>' : ''}
        </div>
      </div>
    </section>`;

    if (onReset) {
      app.querySelector('[data-action="clear-corrupt"]')?.addEventListener('click', onReset);
    }
  }

  function renderResultScreen(app, state) {
    const { esc } = R();
    const game = G();
    const { pack, run, daily, base, resolved } = state;
    const score = game.scoreOf(run);
    const tier = game.scoreTier(score);
    const grid = game.unspoileredGrid(run);
    const companion = daily.companions && daily.companions[pack.companionId] ? daily.companions[pack.companionId] : null;
    const challengeUrl = buildChallengeUrl(base, pack.id);
    const shareText = game.buildShareText(pack, run, challengeUrl);
    const byId = new Map((run.records || []).map((rec) => [rec.levelId, rec]));

    const gridHtml = grid.map((cell, idx) => {
      const symbol = cell === 'hit' ? '✓' : cell === 'miss' ? '×' : '·';
      const label = cell === 'hit' ? '命中' : cell === 'miss' ? '未中' : '未答';
      return `<div class="daily-grid-cell is-${cell}" aria-label="第${idx + 1}关${label}">
        <span class="daily-grid-mark" aria-hidden="true">${symbol}</span>
        <span class="daily-grid-idx">第${idx + 1}关</span>
      </div>`;
    }).join('');

    const companionHtml = companion ? `<section class="daily-companion-card" aria-label="本期纪念陪伴角色">
      <div class="daily-companion-media">
        <img src="${esc(base)}${esc(companion.image)}" alt="${esc(companion.alt || companion.name)}" width="120" height="120" loading="eager">
      </div>
      <div class="daily-companion-body">
        <p class="daily-eyebrow">本期纪念陪伴 · ${esc(companion.name)}</p>
        <p class="daily-companion-hook">${esc(pack.shareHook || companion.description)}</p>
        <p class="daily-companion-note">仅作本期通关纪念与分享装饰，不给消费者做能力分级或人格贴标。</p>
      </div>
    </section>` : '';

    const takeawaysHtml = (pack.levels || []).map((lvl, idx) => {
      const rec = byId.get(lvl.id);
      const isHit = Boolean(rec && rec.correct);
      const userChoiceLabel = rec ? (rec.choice === 'yes' ? lvl.offer.yesLabel : lvl.offer.noLabel) : '未作答';
      const stdChoiceLabel = lvl.answer === 'yes' ? lvl.offer.yesLabel : lvl.offer.noLabel;
      return `<details class="daily-takeaway-item"${idx === 0 ? ' open' : ''}>
        <summary class="daily-takeaway-summary">
          <span class="daily-takeaway-badge ${isHit ? 'is-hit' : 'is-miss'}">${isHit ? '✓ 命中' : '× 差一点'}</span>
          <span class="daily-takeaway-title">第 ${idx + 1} 关 · ${esc(lvl.productSnapshot?.title || lvl.caseTitle)}</span>
        </summary>
        <div class="daily-takeaway-body">
          <p class="daily-takeaway-choices">你的选择：<strong>${esc(userChoiceLabel)}</strong> ｜ 标准判断：<strong>${esc(stdChoiceLabel)}</strong></p>
          <p class="daily-takeaway-twist">${esc(lvl.revealSteps?.twist || '')}</p>
          <p class="daily-takeaway-signal"><strong>下次遇到先看：</strong>${esc(lvl.nextTimeSignal || '')}</p>
          ${renderSourcesList(lvl.sources, lvl.caseSlug, base)}
        </div>
      </details>`;
    }).join('');

    app.innerHTML = `<section class="shell daily-shell daily-result" aria-labelledby="dailyResultTitle">
      <div class="daily-result-hero">
        <div class="daily-result-meta">
          <span class="daily-pack-tag">${resolved.isChallengeInvite ? '挑战链接模式' : resolved.isArchive ? '往期精选存档' : '今日 5 关已完成'}</span>
          <span>${esc(pack.publishedDate)} · ${esc(pack.title)}</span>
        </div>
        <div class="daily-score-row">
          <div class="daily-score-num" aria-label="得分 ${score} 分，满分 5 分"><span>${score}</span><small>/ 5</small></div>
          <div class="daily-score-copy">
            <h1 id="dailyResultTitle">${esc(tier.title)}</h1>
            <p>${esc(tier.summary)}</p>
          </div>
        </div>
        <div class="daily-result-grid" role="group" aria-label="无剧透 5 关成绩网格">${gridHtml}</div>
        <div class="daily-result-actions">
          <button type="button" class="daily-btn daily-btn-primary" data-action="open-share-card">生成无剧透成绩卡</button>
          <button type="button" class="daily-btn" data-action="copy-challenge">复制挑战链接</button>
          <a class="daily-btn" href="${esc(base)}?view=library">去案例库看全卷</a>
        </div>
        <p class="daily-share-feedback" role="status" aria-live="polite"></p>
      </div>

      ${companionHtml}

      <section class="daily-takeaways" aria-labelledby="takeawaysHeading">
        <h2 id="takeawaysHeading">5 关复盘与依据</h2>
        <div class="daily-takeaway-list">${takeawaysHtml}</div>
      </section>

      <aside class="daily-clue-submit" aria-label="消费线索征集">
        <div>
          <h2>遇到过差点买单或反直觉划算的场景？</h2>
          <p>欢迎提交真实消费经历或消协实测线索，核验官方依据后会编入后续关卡。</p>
        </div>
        <a class="daily-btn" href="${esc(buildClueIssueUrl(pack.title))}" target="_blank" rel="noopener noreferrer">提交消费线索</a>
      </aside>
    </section>`;

    const statusEl = app.querySelector('.daily-share-feedback');
    app.querySelector('[data-action="open-share-card"]')?.addEventListener('click', () => {
      if (!global.BuchikuiGameShare) return;
      global.BuchikuiGameShare.openShareDialog({
        pack,
        run,
        companion,
        score,
        tier,
        grid,
        shareUrl: challengeUrl,
        shareText,
        base
      });
    });

    app.querySelector('[data-action="copy-challenge"]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        if (statusEl) statusEl.textContent = '已复制无剧透战绩与挑战链接，可发给朋友来答同一套 5 关。';
      } catch (_err) {
        if (statusEl) statusEl.textContent = `复制挑战链接：${challengeUrl}`;
      }
    });
  }

  function renderPlayScreen(app, state, handlers) {
    const { esc } = R();
    const { pack, run, notice, resolved, base } = state;
    const levels = pack.levels || [];
    const viewIndex = Math.max(0, Math.min(Number.isInteger(run.viewIndex) ? run.viewIndex : run.activeIndex, levels.length - 1));
    const level = levels[viewIndex];
    if (!level) return;

    const record = (run.records || []).find((rec) => rec.levelId === level.id) || null;
    const isFrontierUnanswered = viewIndex === run.activeIndex && run.status === 'ready' && !record;
    const isPastReview = Boolean(record) && viewIndex !== run.activeIndex;

    const clueItems = (level.observableClues || []).map((clue) => `<li>${esc(clue)}</li>`).join('');
    const detailItems = (level.productSnapshot?.details || []).map((item) => `<li>${esc(item)}</li>`).join('');
    const roleClass = ROLE_COLORS[level.levelRole] || 'role-warmup';

    let actionOrRevealHtml = '';
    if (isFrontierUnanswered) {
      actionOrRevealHtml = `<div class="daily-decision-panel">
        <p class="daily-decision-hint">先做判断，再揭晓依据（支持键盘 ← / → 或左右滑动卡片）</p>
        <div class="daily-decision-row">
          <button type="button" class="daily-choice-btn is-no" data-choice="no">
            <span class="daily-choice-dir" aria-hidden="true">←</span>
            <span class="daily-choice-main">${esc(level.offer.noLabel)}</span>
          </button>
          <button type="button" class="daily-choice-btn is-yes" data-choice="yes">
            <span class="daily-choice-main">${esc(level.offer.yesLabel)}</span>
            <span class="daily-choice-dir" aria-hidden="true">→</span>
          </button>
        </div>
      </div>`;
    } else if (record) {
      const showStage2 = isPastReview || run.revealStep >= 2 || run.status === 'resolved';
      const userLabel = record.choice === 'yes' ? level.offer.yesLabel : level.offer.noLabel;
      const answerLabel = level.answer === 'yes' ? level.offer.yesLabel : level.offer.noLabel;
      const nextLabel = viewIndex < run.activeIndex
        ? '回到当前第 ' + (run.activeIndex + 1) + ' 关'
        : (run.activeIndex + 1 >= levels.length ? '查看本期成绩' : `进入第 ${run.activeIndex + 2} 关`);

      actionOrRevealHtml = `<div class="daily-reveal-box ${record.correct ? 'is-hit' : 'is-miss'}" aria-live="polite">
        <div class="daily-verdict-head">
          <span class="daily-verdict-badge">${record.correct ? '✓ 判断命中 · +1 分' : '× 差一点 · 本关 0 分'}</span>
          <span class="daily-verdict-choices">你选了「${esc(userLabel)}」｜标准判断：「${esc(answerLabel)}」</span>
        </div>
        <p class="daily-reveal-twist">${esc(level.revealSteps?.twist || '')}</p>
        ${showStage2 ? `<div class="daily-reveal-stage2">
          <p class="daily-reveal-fact">${esc(level.revealSteps?.factDetail || '')}</p>
          ${level.revealSteps?.scope ? `<p class="daily-reveal-scope"><strong>适用边界：</strong>${esc(level.revealSteps.scope)}</p>` : ''}
          <p class="daily-reveal-signal"><strong>下次遇到先看：</strong>${esc(level.nextTimeSignal || '')}</p>
          ${renderSourcesList(level.sources, level.caseSlug, base)}
        </div>` : `<button type="button" class="daily-btn daily-expand-btn" data-action="expand-reveal">查看依据与下次识别线索</button>`}
        <div class="daily-reveal-nav">
          ${viewIndex > 0 ? `<button type="button" class="daily-btn daily-btn-ghost" data-action="prev-level">查看第 ${viewIndex} 关</button>` : '<span></span>'}
          <button type="button" class="daily-btn daily-btn-primary" data-action="next-step">${esc(nextLabel)}</button>
        </div>
      </div>`;
    }

    const bannerHtml = notice
      ? `<p class="daily-notice" role="status">${esc(notice)}</p>`
      : (resolved.isChallengeInvite
        ? '<p class="daily-notice">好友挑战模式：先按你的真实直觉过 5 关，答完生成无剧透成绩卡。</p>'
        : (resolved.isArchive ? `<p class="daily-notice">当前展示近期已发布关卡（${esc(pack.publishedDate)}）。</p>` : ''));

    app.innerHTML = `<section class="shell daily-shell daily-play" aria-labelledby="dailyPackTitle">
      <div class="daily-topbar">
        <div class="daily-pack-meta">
          <span class="daily-pack-date">${esc(pack.publishedDate)}</span>
          <h1 id="dailyPackTitle" class="daily-pack-title">${esc(pack.title)}</h1>
        </div>
        ${renderPips(pack, run, viewIndex)}
      </div>
      ${bannerHtml}
      <article class="daily-stage-card ${roleClass}" data-level-id="${esc(level.id)}">
        <div class="daily-swipe-stamp is-no" aria-hidden="true">${esc(level.offer.noLabel)}</div>
        <div class="daily-swipe-stamp is-yes" aria-hidden="true">${esc(level.offer.yesLabel)}</div>

        <header class="daily-stage-head">
          <span class="daily-role-pill ${roleClass}">第 ${viewIndex + 1} / ${levels.length} 关 · ${esc(level.roleLabel || '关卡')}</span>
          ${level.evidence?.verifiedAt ? `<span class="daily-verified-tag">核验 ${esc(level.evidence.verifiedAt)}</span>` : ''}
        </header>

        <div class="daily-snapshot">
          <div class="daily-snapshot-main">
            <h2 class="daily-snapshot-title">${esc(level.productSnapshot?.title || '')}</h2>
            <p class="daily-snapshot-price">${esc(level.productSnapshot?.priceOrCondition || '')}</p>
          </div>
          ${detailItems ? `<ul class="daily-snapshot-details">${detailItems}</ul>` : ''}
        </div>

        <p class="daily-goal"><strong>你的目标：</strong>${esc(level.goal || '')}</p>

        <div class="daily-clues">
          <h3>决定前可确认的线索</h3>
          <ul>${clueItems}</ul>
        </div>

        <p class="daily-prompt">${esc(level.prompt || '')}</p>

        ${actionOrRevealHtml}

        <footer class="daily-card-foot">
          ${viewIndex > 0 && isFrontierUnanswered ? `<button type="button" class="daily-text-link" data-action="prev-level">← 回看第 ${viewIndex} 关</button>` : '<span>先决定，后看依据</span>'}
          <a class="daily-text-link" href="${esc(buildFeedbackIssueUrl(pack, level))}" target="_blank" rel="noopener noreferrer">反馈题目勘误</a>
        </footer>
      </article>
    </section>`;

    if (isFrontierUnanswered) {
      let locked = false;
      const commitChoice = (choice) => {
        if (locked) return;
        locked = true;
        handlers.onChoose(choice, level.id);
      };
      app.querySelectorAll('[data-choice]').forEach((btn) => {
        btn.addEventListener('click', () => commitChoice(btn.dataset.choice));
      });
      attachSwipeGesture(app.querySelector('.daily-stage-card'), commitChoice);
      handlers.setKeyboardChoiceHandler(commitChoice);
    } else {
      handlers.setKeyboardChoiceHandler(null);
      app.querySelector('[data-action="expand-reveal"]')?.addEventListener('click', handlers.onExpand);
      app.querySelector('[data-action="next-step"]')?.addEventListener('click', () => {
        if (viewIndex < run.activeIndex) handlers.onGoToLevel(run.activeIndex);
        else handlers.onNextStep();
      });
    }

    app.querySelector('[data-action="prev-level"]')?.addEventListener('click', () => {
      handlers.onGoToLevel(viewIndex - 1);
    });

    app.querySelectorAll('[data-pip-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.pipIndex);
        if (Number.isInteger(idx)) handlers.onGoToLevel(idx);
      });
    });
  }

  function attachSwipeGesture(card, onCommit) {
    if (!card || typeof onCommit !== 'function') return;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let mode = 'idle';

    const resetVisual = () => {
      card.classList.remove('is-dragging', 'is-swiping-no', 'is-swiping-yes');
      card.style.transform = '';
    };

    card.addEventListener('pointerdown', (event) => {
      if (event.button && event.button !== 0) return;
      if (event.target.closest('button, a, summary, details')) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dx = 0;
      dy = 0;
      mode = 'pending';
    });

    card.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId || mode === 'cancelled' || mode === 'idle') return;
      dx = event.clientX - startX;
      dy = event.clientY - startY;

      if (mode === 'pending') {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
          mode = 'cancelled';
          resetVisual();
          return;
        }
        if (Math.abs(dx) >= 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          mode = 'dragging';
          card.classList.add('is-dragging');
          try { card.setPointerCapture(pointerId); } catch (_e) { /* noop */ }
        }
      }

      if (mode === 'dragging') {
        const clamped = Math.max(-130, Math.min(130, dx));
        card.style.transform = `translate3d(${clamped}px, 0, 0) rotate(${(clamped * 0.03).toFixed(2)}deg)`;
        card.classList.toggle('is-swiping-no', clamped < -36);
        card.classList.toggle('is-swiping-yes', clamped > 36);
      }
    });

    const finish = (event) => {
      if (event.pointerId !== pointerId) return;
      const shouldCommit = mode === 'dragging' && Math.abs(dx) >= 72 && Math.abs(dx) > Math.abs(dy) * 1.35;
      const dir = dx < 0 ? 'no' : 'yes';
      pointerId = null;
      mode = 'idle';
      resetVisual();
      if (shouldCommit) onCommit(dir);
    };

    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);
  }

  function mount(options) {
    const app = options.app;
    const base = options.base || './';
    const game = G();
    if (!app || !game) return;

    const search = new URLSearchParams(global.location.search);
    const requestedPackId = search.get('pack') || '';
    const isChallengeInvite = search.get('challenge') === '1';

    let daily = global.BUCHIKUI_DAILY;
    let keyHandler = null;
    let state = null;

    if (global.__buchikuiDailyKeyListener) {
      document.removeEventListener('keydown', global.__buchikuiDailyKeyListener);
    }
    global.__buchikuiDailyKeyListener = (event) => {
      if (!keyHandler) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (document.querySelector('dialog[open]')) return;
      const tag = event.target && event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        keyHandler('no');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        keyHandler('yes');
      }
    };
    document.addEventListener('keydown', global.__buchikuiDailyKeyListener);

    function bootstrapWithDaily(nextDaily) {
      daily = nextDaily;
      const store = loadStore();
      if (store.corrupted) {
        renderFallbackScreen(app, null, base, '检测到本地游戏存档损坏，已阻止错误恢复，你可以重置后重新开始。', () => {
          clearSavedStore();
          bootstrapWithDaily(daily);
        });
        return;
      }

      const resolved = game.resolveActivePack(daily, requestedPackId, isChallengeInvite);
      if (resolved.status !== 'ready' || !resolved.pack) {
        renderFallbackScreen(app, resolved, base);
        return;
      }

      const pack = resolved.pack;
      const mode = isChallengeInvite ? 'challenge' : 'daily';
      const storageId = `${pack.id}:${mode}`;
      const savedRun = store.runs && store.runs[storageId] ? store.runs[storageId] : null;
      const restored = game.restoreRun(savedRun, pack, mode);

      state = {
        daily,
        pack,
        resolved,
        storageId,
        run: restored.run,
        notice: restored.notice,
        base
      };
      saveRun(storageId, state.run);
      draw();
    }

    function draw() {
      if (!state) return;
      if (state.run.status === 'completed') {
        keyHandler = null;
        renderResultScreen(app, state);
        return;
      }
      renderPlayScreen(app, state, {
        onChoose: (choice, levelId) => {
          state.run = game.choose(state.run, state.pack, choice, levelId);
          state.notice = '';
          saveRun(state.storageId, state.run);
          draw();
        },
        onExpand: () => {
          state.run = game.expandReveal(state.run);
          saveRun(state.storageId, state.run);
          draw();
        },
        onNextStep: () => {
          state.run = game.nextStep(state.run);
          saveRun(state.storageId, state.run);
          draw();
        },
        onGoToLevel: (idx) => {
          state.run = game.goToLevel(state.run, idx);
          saveRun(state.storageId, state.run);
          draw();
        },
        setKeyboardChoiceHandler: (fn) => {
          keyHandler = fn;
        }
      });
    }

    bootstrapWithDaily(daily);

    if (global.location && (global.location.hostname === '127.0.0.1' || global.location.hostname === 'localhost')) {
      fetch(`${base}api/daily-content`, { headers: { Accept: 'application/json' } })
        .then((res) => (res.ok ? res.json() : null))
        .then((fresh) => {
          if (fresh && fresh.revision && (!daily || fresh.revision !== daily.revision)) {
            bootstrapWithDaily(fresh);
          }
        })
        .catch(() => {});
    }
  }

  global.BuchikuiGameApp = {
    mount,
    hasSaved,
    STORAGE_KEY
  };
})(window);
