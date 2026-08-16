from pathlib import Path

# index.html: load Cloudflare Turnstile before the dynamic feedback composer.
p = Path('index.html')
s = p.read_text()
old = '<script defer src="https://liuh886.github.io/admin/shared/account-shell.js?v=6"></script>\n<script defer src="feedback.js"></script>'
new = '<script defer src="https://liuh886.github.io/admin/shared/account-shell.js?v=6"></script>\n<script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"></script>\n<script defer src="feedback.js"></script>'
if s.count(old) != 1:
    raise SystemExit('index script marker not found exactly once')
s = s.replace(old, new, 1)
p.write_text(s)

# feedback.js: make Turnstile a mandatory gate and route writes through feedback-submit.
p = Path('feedback.js')
s = p.read_text()

old = """  const state = {
    selection: null,
    composerOpen: false,
    submitting: false,
    selectionTimer: null,
  };"""
new = """  const state = {
    selection: null,
    composerOpen: false,
    submitting: false,
    selectionTimer: null,
    turnstileToken: '',
    turnstileWidgetId: null,
  };"""
if s.count(old) != 1:
    raise SystemExit('state marker not found')
s = s.replace(old, new, 1)

old = """          <p class=\"consumer-feedback-privacy\">请不要提交不必要的身份证号、手机号、订单号等个人信息。</p>
          <p class=\"consumer-feedback-status\" id=\"consumerFeedbackStatus\" role=\"status\" aria-live=\"polite\"></p>
          <div class=\"consumer-feedback-actions\">
            <button type=\"button\" class=\"btn btn-quiet\" data-feedback-close>取消</button>
            <button type=\"submit\" class=\"btn btn-primary\" id=\"consumerFeedbackSubmit\">提交给编辑</button>
          </div>"""
new = """          <p class=\"consumer-feedback-privacy\">请不要提交不必要的身份证号、手机号、订单号等个人信息。</p>
          <div class=\"consumer-feedback-verification\">
            <div class=\"consumer-feedback-turnstile\" id=\"consumerFeedbackTurnstile\" aria-label=\"Cloudflare 人机验证\"></div>
            <p id=\"consumerFeedbackVerificationStatus\" role=\"status\" aria-live=\"polite\">正在加载人机验证…</p>
          </div>
          <p class=\"consumer-feedback-status\" id=\"consumerFeedbackStatus\" role=\"status\" aria-live=\"polite\"></p>
          <div class=\"consumer-feedback-actions\">
            <button type=\"button\" class=\"btn btn-quiet\" data-feedback-close>取消</button>
            <button type=\"submit\" class=\"btn btn-primary\" id=\"consumerFeedbackSubmit\" disabled>验证后提交</button>
          </div>"""
if s.count(old) != 1:
    raise SystemExit('composer actions marker not found')
s = s.replace(old, new, 1)

old = """  const composer = createComposer();

  function openComposer(selection) {"""
new = """  const composer = createComposer();

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

  function openComposer(selection) {"""
if s.count(old) != 1:
    raise SystemExit('composer insertion marker not found')
s = s.replace(old, new, 1)

old = """    composer.querySelector('#consumerFeedbackStatus').textContent = '';
    composer.querySelector('#consumerFeedbackMessage').value = '';
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => composer.querySelector('#consumerFeedbackMessage')?.focus(), 0);
  }"""
new = """    composer.querySelector('#consumerFeedbackStatus').textContent = '';
    composer.querySelector('#consumerFeedbackMessage').value = '';
    removeTurnstile();
    syncSubmitState();
    window.getSelection()?.removeAllRanges();
    void prepareTurnstile();
    window.setTimeout(() => composer.querySelector('#consumerFeedbackMessage')?.focus(), 0);
  }"""
if s.count(old) != 1:
    raise SystemExit('open composer marker not found')
s = s.replace(old, new, 1)

old = """    state.selection = null;
    composer.hidden = true;
    document.documentElement.classList.remove('consumer-feedback-open');
    if (!keepPending) clearPending();"""
new = """    state.selection = null;
    removeTurnstile();
    composer.hidden = true;
    document.documentElement.classList.remove('consumer-feedback-open');
    if (!keepPending) clearPending();"""
if s.count(old) != 1:
    raise SystemExit('close composer marker not found')
s = s.replace(old, new, 1)

start = s.index('  async function submitFeedback(event) {')
end = s.index('\n  function resumePending(accountState) {', start)
old = s[start:end]
new = """  async function submitFeedback(event) {
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
    const feedbackType = composer.querySelector('input[name=\"feedbackType\"]:checked')?.value || 'experience';
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
"""
s = s[:start] + new + s[end:]

if ".from('product_feedback').insert" in s:
    raise SystemExit('direct product_feedback insert remains')
p.write_text(s)

# feedback.css: restrained Turnstile block; no new visual system.
p = Path('feedback.css')
s = p.read_text()
marker = '.consumer-feedback-privacy{margin:8px 0 0;color:#777;font:400 11px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}\n'
if s.count(marker) != 1:
    raise SystemExit('feedback css marker not found')
addition = marker + '.consumer-feedback-verification{margin-top:16px;padding:16px 0 0;border-top:1px solid rgba(17,17,17,.18)}\n.consumer-feedback-turnstile{min-height:65px;width:100%;overflow:hidden}\n.consumer-feedback-verification p{margin:8px 0 0;color:#666;font:600 11px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}\n.consumer-feedback-actions .btn:disabled{opacity:.42;cursor:not-allowed}\n'
s = s.replace(marker, addition, 1)
p.write_text(s)
