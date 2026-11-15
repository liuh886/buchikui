"""End-to-end headless browser verification for Daily 5 game and Case Library."""
import json
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = int(os.environ.get('DAILY_TEST_PORT', '4193'))
BASE_URL = f'http://127.0.0.1:{PORT}/'


def wait_for_server(url, timeout=15.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as res:
                if res.status == 200:
                    return
        except Exception:
            time.sleep(0.25)
    raise RuntimeError(f'Preview server failed to start at {url}')


def assert_no_overflow(page, label=''):
    overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth')
    if overflow:
        offenders = page.evaluate('''() => [...document.querySelectorAll('body *')]
          .map(el => ({ tag: el.tagName, cls: el.className, right: el.getBoundingClientRect().right }))
          .filter(el => el.right > innerWidth + 1)
          .slice(0, 10)''')
        raise AssertionError(f'Horizontal overflow ({label}): {offenders}')


def assert_hit_targets(page, selectors):
    for sel in selectors:
        boxes = page.evaluate(f'''() => [...document.querySelectorAll({json.dumps(sel)})]
          .filter(el => el.offsetParent !== null)
          .map(el => {{ const r = el.getBoundingClientRect(); return {{ w: r.width, h: r.height, text: el.textContent.trim().slice(0, 24) }}; }})''')
        for b in boxes:
            assert b['h'] >= 44 and b['w'] >= 44, f'Target < 44px ({sel}): {b}'


def main():
    temp_dir = Path(tempfile.mkdtemp(prefix='buchikui-daily-e2e-'))
    env = {
        **os.environ,
        'PORT': str(PORT),
        'SURVEY_RESPONSE_DB': str(temp_dir / 'survey-e2e.sqlite')
    }
    server = subprocess.Popen(
        ['node', 'scripts/serve.mjs'],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    errors = []
    console_errors = []

    try:
        wait_for_server(BASE_URL)
        expected_answers = ['no', 'yes', 'no', 'yes', 'no']

        with sync_playwright() as p:
            browser = p.chromium.launch(channel='msedge', headless=True)

            # 1. Responsive checks across 390x844, 390x666, 320x640, 1365x900 + full 5/5 flow
            for vw, vh in [(390, 844), (390, 666), (320, 640), (1365, 900)]:
                ctx = browser.new_context(viewport={'width': vw, 'height': vh}, reduced_motion='reduce')
                pg = ctx.new_page()
                pg.on('pageerror', lambda e: errors.append(f'{vw}x{vh}: {e}'))
                pg.goto(BASE_URL, wait_until='networkidle')
                expect(pg.locator('.daily-stage-card')).to_be_visible()
                assert '你是否遭遇过：' not in pg.content(), 'Survey prefix leaked onto homepage'
                assert_no_overflow(pg, f'home {vw}x{vh}')
                assert_hit_targets(pg, ['.daily-choice-btn'])
                ctx.close()

            # 2. Full 5/5 run on 390x844 (keyboard + click + 2-stage reveal + share card PNG + library nav)
            ctx = browser.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
            page = ctx.new_page()
            page.on('pageerror', lambda e: errors.append(f'5of5: {e}'))
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

            page.goto(BASE_URL, wait_until='networkidle')
            for idx, ans in enumerate(expected_answers):
                expect(page.locator('.daily-role-pill')).to_contain_text(f'第 {idx + 1} / 5 关')
                if idx == 1:
                    page.keyboard.press('ArrowRight' if ans == 'yes' else 'ArrowLeft')
                else:
                    page.locator(f'[data-choice="{ans}"]').click()
                expect(page.locator('.daily-reveal-box.is-hit')).to_be_visible()
                expect(page.locator('.daily-expand-btn')).to_be_visible()
                page.locator('[data-action="expand-reveal"]').click()
                expect(page.locator('.daily-reveal-stage2')).to_be_visible()
                assert_no_overflow(page, f'reveal L{idx + 1}')

                # Back-level read-only check on level 2
                if idx == 1:
                    page.locator('[data-action="prev-level"]').click()
                    expect(page.locator('.daily-role-pill')).to_contain_text('第 1 / 5 关')
                    page.locator('[data-action="next-step"]').click()
                    expect(page.locator('.daily-role-pill')).to_contain_text('第 2 / 5 关')

                page.locator('[data-action="next-step"]').click()

            expect(page.locator('.daily-result')).to_be_visible()
            expect(page.locator('.daily-score-num')).to_contain_text('5')
            assert_no_overflow(page, 'result 390x844')
            assert_hit_targets(page, ['.daily-result-actions .daily-btn', '.daily-clue-submit .daily-btn'])

            # Companion image must actually load
            img_ok = page.evaluate('''() => {
              const img = document.querySelector('.daily-companion-media img');
              return Boolean(img && img.complete && img.naturalWidth > 0);
            }''')
            assert img_ok, 'Companion portrait image failed to render on result screen'

            # Open PNG Share Card Dialog & download
            page.locator('[data-action="open-share-card"]').click()
            dialog = page.locator('#dailyShareDialog')
            expect(dialog).to_be_visible()
            expect(dialog.locator('.daily-share-preview img')).to_be_visible()
            with page.expect_download() as dl_info:
                dialog.locator('[data-action="download"]').click()
            dl = dl_info.value
            assert dl.suggested_filename.endswith('.png'), f'Unexpected filename: {dl.suggested_filename}'
            dialog.locator('.daily-share-close').click()
            expect(dialog).not_to_be_visible()

            # Navigate to Case Library and to a Case chapter and back
            page.goto(f'{BASE_URL}?view=library', wait_until='networkidle')
            expect(page.locator('.library-book')).to_be_visible()
            assert_no_overflow(page, 'library 390x844')
            page.locator('.library-book a[href*="/c/"]').first.click()
            page.wait_for_load_state('networkidle')
            expect(page.locator('.case-page')).to_be_visible()
            assert_no_overflow(page, 'case chapter 390x844')
            expect(page.locator('a', has_text='返回挑战').first).to_be_visible()
            ctx.close()

            # 3. 0/5 Challenge invite run + refresh mid-run persistence + missing pack fallback + corrupt storage
            ctx2 = browser.new_context(viewport={'width': 390, 'height': 844})
            p2 = ctx2.new_page()
            p2.on('pageerror', lambda e: errors.append(f'0of5: {e}'))
            p2.goto(f'{BASE_URL}?pack=episode-001&challenge=1', wait_until='networkidle')
            expect(p2.locator('.daily-notice')).to_contain_text('好友挑战模式')

            for idx in range(2):
                wrong = 'yes' if expected_answers[idx] == 'no' else 'no'
                p2.locator(f'[data-choice="{wrong}"]').click()
                expect(p2.locator('.daily-reveal-box.is-miss')).to_be_visible()
                p2.locator('[data-action="next-step"]').click()

            # Reload after L2 and confirm frontier resumes cleanly at L3
            p2.reload(wait_until='networkidle')
            expect(p2.locator('.daily-role-pill')).to_contain_text('第 3 / 5 关')

            for idx in range(2, 5):
                wrong = 'yes' if expected_answers[idx] == 'no' else 'no'
                p2.locator(f'[data-choice="{wrong}"]').click()
                p2.locator('[data-action="next-step"]').click()

            expect(p2.locator('.daily-score-num')).to_contain_text('0')

            # Missing pack fallback
            p2.goto(f'{BASE_URL}?pack=nonexistent-pack-999', wait_until='networkidle')
            expect(p2.locator('.daily-fallback')).to_be_visible()

            # Corrupted localStorage safety
            p2.goto(BASE_URL, wait_until='networkidle')
            p2.evaluate('localStorage.setItem("buchikui-daily-v1", "{bad-json")')
            p2.reload(wait_until='networkidle')
            expect(p2.locator('[data-action="clear-corrupt"]')).to_be_visible()
            p2.locator('[data-action="clear-corrupt"]').click()
            expect(p2.locator('.daily-stage-card')).to_be_visible()
            ctx2.close()

            browser.close()

        assert not errors, f'Unhandled page errors: {errors}'
        assert not console_errors, f'Console errors: {console_errors}'
        print('DAILY_BROWSER_E2E_OK')
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()


if __name__ == '__main__':
    main()
