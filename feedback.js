(() => {
  'use strict';

  const PENDING_KEY = 'buchikui-pending-feedback-v1';
  const MAX_QUOTE_LENGTH = 1200;
  const CONTEXT_LENGTH = 32;
  const cases = window.BUCHIKUI_CASES || [];

  const state = {
    selection: null,
    composerOpen: false,
    submitting: false,
    selectionTimer: null,
    turnstileToken: '',
    turnstileWidgetId: null,
  };

  const normalizeText = (value) => String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const elementForNode = (node) => node?.nodeType === Node.ELEMENT_NODE
    ? node
    : node?.parentElement || null;

  const currentCase = () => {
    const id = document.getElementById('caseSwitcherId')?.textContent?.match(/\d+/)?.[0];
    if (!id) return null;
    return cases.find((item) => String(item.id) === String(id).padStart(3, '0')) || null;
  };

  const safeAnchorPart = (value) => normalizeText(value)
    .replace(/[.#/?&=]+/g, '-')
    .replace(/\s+/g, '-');

  function indexWithin(parent, child, selector) {
    if (!parent || !child) return -1;
    return [...parent.querySelectorAll(`:scope > ${selector}`)].indexOf(child);
  }

  function resolveAnchor(element, active) {
    if (!element || !active || element.closest('.consumer-feedback-composer')) return null;

    if (element.closest('#heroCopy')) {
      return { element: document.getElementById('heroCopy'), key: 'hero.copy', label: '开场说明' };
    }

    const panicItem = element.closest('.panic-list > li');
    if (panicItem) {
      const index = indexWithin(document.getElementById('panicList'), panicItem, 'li');
      return index >= 0
        ? { element: panicItem, key: `panic.${String(index + 1).padStart(2, '0')}`, label: `立即行动 ${index + 1}` }
        : null;
    }

    const caseArticle = element.closest('.case');
    if (caseArticle) {
      const index = indexWithin(document.getElementById('caseList'), caseArticle, '.case');
      const scenario = active.scenarios?.[index];
      if (!scenario) return null;
      const scenarioKey = `scenario.${safeAnchorPart(scenario.short)}`;
      const title = element.closest('.case-title');
      if (title) return { element: title, key: `${scenarioKey}.title`, label: scenario.short };
      const block = element.closest('.case-block');
      if (block) {
        const label = normalizeText(block.querySelector('b')?.textContent || '正文');
        const role = block.classList.contains('action') ? 'action' : safeAnchorPart(label || 'fact');
        return { element: block, key: `${scenarioKey}.${role}`, label: `${scenario.short} · ${label}` };
      }
    }

    const evidence = element.closest('.check');
    if (evidence) {
      const key = evidence.querySelector('[data-evidence]')?.dataset.evidence;
      const title = normalizeText(evidence.querySelector('strong')?.textContent || '关键证据');
      if (key) return { element: evidence, key: `evidence.${safeAnchorPart(key)}`, label: title };
    }

    const routeStep = element.closest('.route-step');
    if (routeStep) {
      const index = indexWithin(document.getElementById('routeGrid'), routeStep, '.route-step');
      const title = normalizeText(routeStep.querySelector('h3')?.textContent || `步骤 ${index + 1}`);
      return index >= 0
        ? { element: routeStep, key: `route.step.${String(index + 1).padStart(2, '0')}`, label: title }
        : null;
    }

    if (element.closest('#routeNote')) {
      return { element: document.getElementById('routeNote'), key: 'route.note', label: '路径补充说明' };
    }

    if (element.closest('#templateText')) {
      return { element: document.getElementById('templateText'), key: 'template.body', label: '可复制模板' };
    }

    const staticAnchors = [
      ['casesIntro', 'section.scenarios.intro', '场景说明'],
      ['evidenceIntro', 'section.evidence.intro', '证据说明'],
      ['routeIntro', 'section.route.intro', '路径说明'],
      ['templateIntro', 'section.template.intro', '模板说明'],
    ];
    for (const [id, key, label] of staticAnchors) {
      const target = document.getElementById(id);
      if (target && target.contains(element)) return { element: target, key, label };
    }

    return null;
  }

  function findNearestOccurrence(full, exact, approximateStart) {
    let position = full.indexOf(exact);
    if (position < 0) return -1;
    let best = position;
    let bestDistance = Math.abs(position - approximateStart);
    while (position >= 0) {
      const distance = Math.abs(position - approximateStart);
      if (distance < bestDistance) {
        best = position;
        bestDistance = distance;
      }
      position = full.indexOf(exact, position + 1);
    }
    return best;
  }

  function captureSelection() {
    if (state.composerOpen) return null;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return null;
    const range = selection.getRangeAt(0);
    const active = currentCase();
    if (!active) return null;

    const startAnchor = resolveAnchor(elementForNode(range.startContainer), active);
    const endAnchor = resolveAnchor(elementForNode(range.endContainer), active);
    if (!startAnchor || !endAnchor || startAnchor.element !== endAnchor.element) return null;

    const exact = normalizeText(range.toString());
    if (exact.length < 2 || exact.length > MAX_QUOTE_LENGTH) return null;

    const preRange = document.createRange();
    preRange.selectNodeContents(startAnchor.element);
    preRange.setEnd(range.startContainer, range.startOffset);
    const approximateStart = normalizeText(preRange.toString()).length;
    const full = normalizeText(startAnchor.element.innerText || startAnchor.element.textContent || '');
    const start = findNearestOccurrence(full, exact, approximateStart);
    if (start < 0) return null;
    const end = start + exact.length;

    const canonical = new URL(window.location.href);
    canonical.search = '';
    canonical.hash = '';
    canonical.searchParams.set('case', active.slug);

    return {
      created_at: new Date().toISOString(),
      case_id: active.id,
      case_slug: active.slug,
      case_name: active.name,
      case_updated: active.updated,
      page_url: canonical.toString(),
      anchor_key: startAnchor.key,
      anchor_label: startAnchor.label,
      selector: {
        type: 'TextQuoteSelector',
        exact,
        prefix: full.slice(Math.max(0, start - CONTEXT_LENGTH), start),
        suffix: full.slice(end, end + CONTEXT_LENGTH),
      },
      position: {
        type: 'TextPositionSelector',
        start,
        end,
      },
      block_text: full,
      rect: (() => {
        const rects = [...range.getClientRects()];
        const rect = rects.at(-1) || range.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      })(),
    };
  }

  function createSelectionAction() {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'consumerFeedbackAction';
    button.className = 'consumer-feedback-action';
    button.textContent = '补充经验';
    button.hidden = true;
    button.setAttribute('aria-label', '针对选中的文字补充消费者经验');
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', () => void beginFeedback());
    document.body.appendChild(button);
    return button;
  }

  function createToast() {
    const toast = document.createElement('div');
    toast.id = 'consumerFeedbackToast';
    toast.className = 'consumer-feedback-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.hidden = true;
    document.body.appendChild(toast);
    return toast;
  }

  const action = createSelectionAction();
  const toast = createToast();
  let toastTimer = null;

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => { toast.hidden = true; }, 180);
    }, 2600);
  }

  function hideSelectionAction() {
    action.hidden = true;
    action.classList.remove('is-mobile');
  }

  function positionSelectionAction(selection) {
    if (!selection?.rect) return hideSelectionAction();
    action.hidden = false;
    if (window.innerWidth <= 680) {
      action.classList.add('is-mobile');
      action.style.left = '50%';
      action.style.top = 'auto';
      return;
    }
    action.classList.remove('is-mobile');
    const width = 118;
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, selection.rect.right - width / 2));
    const top = Math.max(12, selection.rect.top - 46);
    action.style.left = `${left}px`;
    action.style.top = `${top}px`;
  }

  function handleSelectionChange() {
    if (state.composerOpen) return;
    window.clearTimeout(state.selectionTimer);
    state.selectionTimer = window.setTimeout(() => {
      if (state.composerOpen) return;
      const next = captureSelection();
      state.selection = next;
      if (next) positionSelectionAction(next);
      else hideSelectionAction();
    }, 90);
  }

  function savePending(selection) {
    const payload = { ...selection };
    delete payload.rect;
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  }

  function readPending() {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      if (!pending?.case_slug || !pending?.selector?.exact) return null;
      if (Date.now() - new Date(pending.created_at).getTime() > 6 * 60 * 60 * 1000) {
        localStorage.removeItem(PENDING_KEY);
        return null;
      }
      return pending;
    } catch {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
  }

  function clearPending() {
    localStorage.removeItem(PENDING_KEY);
  }

  async function beginFeedback() {
    const selection = state.selection || readPending();
    if (!selection) return;
    hideSelectionAction();
    savePending(selection);

    const account = window.HaoAccount;
    const accountState = account?.getState?.();
    if (!account || !accountState?.user) {
      showToast('登录后会继续这条段落反馈。');
      account?.open?.();
      return;
    }
    openComposer(selection);
  }

  function createComposer() {
    const host = document.createElement('div');
    host.id = 'consumerFeedbackComposer';
    host.className = 'consumer-feedback-composer';
    host.hidden = true;
    host.innerHTML = `
      <div class="consumer-feedback-backdrop" data-feedback-close></div>
      <section class="consumer-feedback-panel" role="dialog" aria-modal="true" aria-labelledby="consumerFeedbackTitle">
        <header class="consumer-feedback-head">
          <div>
            <span>CONSUMER NOTE</span>
            <h2 id="consumerFeedbackTitle">补充一条真实经验</h2>
          </div>
          <button type="button" class="consumer-feedback-close" data-feedback-close aria-label="关闭">×</button>
        </header>
        <p class="consumer-feedback-intro">这不是公开评论。你的补充会进入编辑收件箱，集中 review 后再决定是否吸收到正式 CASE。</p>
        <div class="consumer-feedback-context">
          <span id="consumerFeedbackCase"></span>
          <strong id="consumerFeedbackAnchor"></strong>
          <blockquote id="consumerFeedbackQuote"></blockquote>
        </div>
        <form id="consumerFeedbackForm">
          <fieldset class="consumer-feedback-types">
            <legend>这条反馈属于：</legend>
            <label><input type="radio" name="feedbackType" value="experience" checked><span><strong>亲身经历</strong><small>你实际遇到过什么，最后怎么处理</small></span></label>
            <label><input type="radio" name="feedbackType" value="correction"><span><strong>信息纠错</strong><small>这段内容有事实、规则或表述问题</small></span></label>
            <label><input type="radio" name="feedbackType" value="process"><span><strong>流程补充</strong><small>还有一个现实中很关键的步骤或坑</small></span></label>
            <label><input type="radio" name="feedbackType" value="other"><span><strong>其他</strong><small>值得编辑知道的其他信息</small></span></label>
          </fieldset>
          <label class="consumer-feedback-message">
            <span>你的补充</span>
            <textarea id="consumerFeedbackMessage" maxlength="4000" rows="7" required placeholder="尽量写清：发生了什么、对方怎么处理、你做了什么、结果怎样。"></textarea>
          </label>
          <p class="consumer-feedback-privacy">请不要提交不必要的身份证号、手机号、订单号等个人信息。</p>
          <div class="consumer-feedback-verification">
            <div class="consumer-feedback-turnstile" id="consumerFeedbackTurnstile" aria-label="Cloudflare 人机验证"></div>
            <p id="consumerFeedbackVerificationStatus" role="status" aria-live="polite">正在加载人机验证…</p>
          </div>
          <p class="consumer-feedback-status" id="consumerFeedbackStatus" role="status" aria-live="polite"></p>
          <div class="consumer-feedback-actions">
            <button type="button" class="btn btn-quiet" data-feedback-close>取消</button>
            <button type="submit" class="btn btn-primary" id="consumerFeedbackSubmit" disabled>验证后提交</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(host);
    host.querySelectorAll('[data-feedback-close]').forEach((button) => button.addEventListener('click', () => closeComposer()));
    host.querySelector('#consumerFeedbackForm').addEventListener('submit', (event) => void submitFeedback(event));
    return host;
  }

  const composer = createComposer();

  function syncSubmitState() {
    const submit = composer.querySelector('#consumerFeedbackSubmit');
    if (!submit) return;
    submit.disabled = state.submitting || !state.turnstileToken;
    submit.textContent = state.submitting
      ? '提交中…'
      : state.turnstileToken
        ? '提交给编辑'
        : '验证后提交';
  }

  function resetTurnstile(message = '完成人机验证后才能提交。') {
    state.turnstileToken = '';
    syncSubmitState();
    const status = composer.querySelector('#consumerFeedbackVerificationStatus');
    if (status) status.textContent = message;
    if (state.turnstileWidgetId !== null && window.turnstile?.reset) {
      window.turnstile.reset(state.turnstileWidgetId);
    }
  }

  function removeTurnstile() {
    state.turnstileToken = '';
    if (state.turnstileWidgetId !== null && window.turnstile?.remove) {
      window.turnstile.remove(state.turnstileWidgetId);
    }
    state.turnstileWidgetId = null;
  }

  async function prepareTurnstile() {
    const status = composer.querySelector('#consumerFeedbackVerificationStatus');
    const container = composer.querySelector('#consumerFeedbackTurnstile');
    state.turnstileToken = '';
    syncSubmitState();
    if (status) status.textContent = '正在加载人机验证…';
    if (container) container.innerHTML = '';

    try {
      const account = window.HaoAccount;
      const client = await account?.getClient?.();
      if (!client) throw new Error('Account client unavailable');
      const { data, error } = await client.functions.invoke('feedback-submit', {
        body: { action: 'config' },
      });
      if (error || !data?.enabled || !data?.site_key) throw new Error('Turnstile not configured');
      if (!window.turnstile?.render) throw new Error('Turnstile script unavailable');

      removeTurnstile();
      state.turnstileWidgetId = window.turnstile.render('#consumerFeedbackTurnstile', {
        sitekey: data.site_key,
        action: data.action || 'buchikui_feedback',
        theme: 'light',
        size: 'flexible',
        callback: (token) => {
          state.turnstileToken = token;
          if (status) status.textContent = '验证完成，可以提交。';
          syncSubmitState();
        },
        'expired-callback': () => resetTurnstile('验证已过期，请重新完成后再提交。'),
        'timeout-callback': () => resetTurnstile('验证超时，请重新完成后再提交。'),
        'error-callback': () => {
          resetTurnstile('机器人验证失败，请重新验证。');
          return true;
        },
      });
      if (status) status.textContent = '完成人机验证后才能提交。';
    } catch (error) {
      console.warn('Buchikui Turnstile:', error);
      removeTurnstile();
      syncSubmitState();
      if (status) status.textContent = '机器人验证暂不可用，提交已锁定。';
    }
  }

  function openComposer(selection) {
    state.selection = selection;
    state.composerOpen = true;
    composer.hidden = false;
    document.documentElement.classList.add('consumer-feedback-open');
    composer.querySelector('#consumerFeedbackCase').textContent = `CASE ${selection.case_id} · ${selection.case_name}`;
    composer.querySelector('#consumerFeedbackAnchor').textContent = selection.anchor_label || selection.anchor_key;
    composer.querySelector('#consumerFeedbackQuote').textContent = `“${selection.selector.exact}”`;
    composer.querySelector('#consumerFeedbackStatus').textContent = '';
    composer.querySelector('#consumerFeedbackMessage').value = '';
    removeTurnstile();
    syncSubmitState();
    window.getSelection()?.removeAllRanges();
    void prepareTurnstile();
    window.setTimeout(() => composer.querySelector('#consumerFeedbackMessage')?.focus(), 0);
  }

  function closeComposer({ keepPending = false } = {}) {
    if (state.submitting) return;
    state.composerOpen = false;
    state.selection = null;
    removeTurnstile();
    composer.hidden = true;
    document.documentElement.classList.remove('consumer-feedback-open');
    if (!keepPending) clearPending();
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value || ''));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function submitFeedback(event) {
    event.preventDefault();
    if (state.submitting || !state.selection || !state.turnstileToken) return;
    const account = window.HaoAccount;
    const accountState = account?.getState?.();
    if (!accountState?.user) {
      savePending(state.selection);
      closeComposer({ keepPending: true });
      account?.open?.();
      return;
    }

    const message = normalizeText(composer.querySelector('#consumerFeedbackMessage').value);
    if (!message) return;
    const feedbackType = composer.querySelector('input[name="feedbackType"]:checked')?.value || 'experience';
    const status = composer.querySelector('#consumerFeedbackStatus');
    const turnstileToken = state.turnstileToken;
    state.submitting = true;
    syncSubmitState();
    status.textContent = '正在把这条经验送进编辑收件箱…';

    try {
      const client = await account.getClient();
      const blockHash = await sha256(state.selection.block_text || '');
      const { data, error } = await client.functions.invoke('feedback-submit', {
        body: {
          action: 'submit',
          turnstile_token: turnstileToken,
          feedback_type: feedbackType,
          message: message.slice(0, 4000),
          page_url: state.selection.page_url,
          case_id: state.selection.case_id,
          case_slug: state.selection.case_slug,
          case_name: state.selection.case_name,
          case_updated: state.selection.case_updated,
          anchor_key: state.selection.anchor_key,
          anchor_label: state.selection.anchor_label,
          quote_exact: state.selection.selector.exact,
          quote_prefix: state.selection.selector.prefix,
          quote_suffix: state.selection.selector.suffix,
          position_start: state.selection.position.start,
          position_end: state.selection.position.end,
          block_text_sha256: blockHash,
        },
      });
      if (error || !data?.ok) throw error || new Error('Feedback submission failed');

      clearPending();
      state.submitting = false;
      state.turnstileToken = '';
      syncSubmitState();
      status.textContent = '已提交。';
      window.setTimeout(() => {
        closeComposer();
        showToast('谢谢，这条经验已进入编辑收件箱。');
      }, 360);
    } catch (error) {
      console.warn('Buchikui anchored feedback:', error);
      status.textContent = '提交失败，请重新验证后再试。';
      state.submitting = false;
      resetTurnstile('请重新完成人机验证。');
    }
  }

  function resumePending(accountState) {
    const pending = readPending();
    if (!pending || !accountState?.user || state.composerOpen) return;
    const active = currentCase();
    if (!active) return;
    if (active.slug !== pending.case_slug) {
      const target = new URL(window.location.href);
      target.search = '';
      target.hash = '';
      target.searchParams.set('case', pending.case_slug);
      window.location.replace(target.toString());
      return;
    }
    state.selection = pending;
    window.setTimeout(() => openComposer(pending), 120);
  }

  document.addEventListener('selectionchange', handleSelectionChange);
  window.addEventListener('resize', () => {
    if (state.selection && !action.hidden) positionSelectionAction(state.selection);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.composerOpen) closeComposer();
  });

  if (window.HaoAccount?.subscribe) {
    window.HaoAccount.subscribe((accountState) => resumePending(accountState));
  } else {
    window.addEventListener('hao:account-changed', (event) => resumePending(event.detail));
  }
})();
