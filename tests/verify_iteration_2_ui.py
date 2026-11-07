"""Verification script for Iteration 2: short screens, takeaway on first screen, and alignment."""
import os
import sys
import tempfile
import time
import subprocess
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

PORT = 4193
URL = f"http://localhost:{PORT}/"
TMP_DB = Path(tempfile.gettempdir()) / f"buchikui-test-survey-{os.getpid()}.sqlite"

env = os.environ.copy()
env['PORT'] = str(PORT)
env['SURVEY_RESPONSE_DB'] = str(TMP_DB)

# Start isolated preview server
server = subprocess.Popen(['node', 'scripts/serve.mjs'], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(1.5)

errors = []
results = {}

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        
        # Test 1: 390x666 Short screen on Q1 and Longest Q (Q6)
        print("Testing 390x666 short screen...")
        ctx_short = browser.new_context(viewport={'width': 390, 'height': 666}, reduced_motion='reduce')
        page_short = ctx_short.new_page()
        page_short.goto(URL)
        page_short.wait_for_load_state('networkidle')
        
        # Q1 checks
        no_btn = page_short.locator('[data-response="no"]')
        yes_btn = page_short.locator('[data-response="yes"]')
        expect(no_btn).to_be_visible()
        expect(yes_btn).to_be_visible()
        
        q_font = page_short.evaluate("getComputedStyle(document.querySelector('.survey-question')).fontSize")
        print(f"390x666 Q1 question font size: {q_font}")
        assert q_font == '20px', f"Expected 20px question font on short screen, got {q_font}"

        no_box = no_btn.bounding_box()
        yes_box = yes_btn.bounding_box()
        print(f"390x666 Q1 buttons bottom: NO={no_box['y']+no_box['height']}, YES={yes_box['y']+yes_box['height']}")
        assert no_box['y'] + no_box['height'] <= 666, f"NO button cut off on 390x666: {no_box}"
        assert yes_box['y'] + yes_box['height'] <= 666, f"YES button cut off on 390x666: {yes_box}"
        assert no_box['width'] >= 44 and no_box['height'] >= 44
        assert yes_box['width'] >= 44 and yes_box['height'] >= 44
        assert page_short.evaluate("document.documentElement.scrollWidth <= innerWidth")
        
        # Advance to Q6 (longest question: photo-unfinished)
        for i in range(5):
            page_short.locator('[data-response="no"]').click()
            time.sleep(0.05)
            
        expect(page_short.locator('.survey-step')).to_have_text('6 / 8')
        no_box6 = page_short.locator('[data-response="no"]').bounding_box()
        yes_box6 = page_short.locator('[data-response="yes"]').bounding_box()
        print(f"390x666 Q6 buttons bottom: NO={no_box6['y']+no_box6['height']}, YES={yes_box6['y']+yes_box6['height']}")
        assert no_box6['y'] + no_box6['height'] <= 666, f"NO button cut off on Q6 390x666: {no_box6}"
        assert yes_box6['y'] + yes_box6['height'] <= 666, f"YES button cut off on Q6 390x666: {yes_box6}"
        assert page_short.evaluate("document.documentElement.scrollWidth <= innerWidth")
        ctx_short.close()
        results['short_screen_390x666'] = 'passed'
        
        # Test 2: 320x640 Narrow screen on Q1 and Q6
        print("Testing 320x640 narrow screen...")
        ctx_narrow = browser.new_context(viewport={'width': 320, 'height': 640}, reduced_motion='reduce')
        page_narrow = ctx_narrow.new_page()
        page_narrow.goto(URL)
        page_narrow.wait_for_load_state('networkidle')
        no_box_nar = page_narrow.locator('[data-response="no"]').bounding_box()
        yes_box_nar = page_narrow.locator('[data-response="yes"]').bounding_box()
        print(f"320x640 Q1 buttons bottom: NO={no_box_nar['y']+no_box_nar['height']}, YES={yes_box_nar['y']+yes_box_nar['height']}")
        assert no_box_nar['y'] + no_box_nar['height'] <= 640, f"Button cut off on 320x640: {no_box_nar}"
        assert yes_box_nar['y'] + yes_box_nar['height'] <= 640, f"Button cut off on 320x640: {yes_box_nar}"
        assert page_narrow.evaluate("document.documentElement.scrollWidth <= innerWidth")

        # Advance to Q6 on 320x640
        for i in range(5):
            page_narrow.locator('[data-response="no"]').click()
            time.sleep(0.05)
        expect(page_narrow.locator('.survey-step')).to_have_text('6 / 8')
        no_box_nar6 = page_narrow.locator('[data-response="no"]').bounding_box()
        yes_box_nar6 = page_narrow.locator('[data-response="yes"]').bounding_box()
        print(f"320x640 Q6 buttons bottom: NO={no_box_nar6['y']+no_box_nar6['height']}, YES={yes_box_nar6['y']+yes_box_nar6['height']}")
        assert no_box_nar6['y'] + no_box_nar6['height'] <= 640, f"Button cut off on Q6 320x640: {no_box_nar6}"
        assert yes_box_nar6['y'] + yes_box_nar6['height'] <= 640, f"Button cut off on Q6 320x640: {yes_box_nar6}"
        assert page_narrow.evaluate("document.documentElement.scrollWidth <= innerWidth")

        ctx_narrow.close()
        results['narrow_screen_320x640'] = 'passed'
        
        # Test 3: Result first screen (390x844 and 390x666)
        print("Testing Result first screen takeaways...")
        ctx_res = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        page_res = ctx_res.new_page()
        page_res.goto(URL)
        page_res.wait_for_load_state('networkidle')
        
        # Answer with reproduction case: NO, YES, YES, NO, NO, YES, YES, YES
        choices = ['no', 'yes', 'yes', 'no', 'no', 'yes', 'yes', 'yes']
        for c in choices:
            page_res.locator(f'[data-response="{c}"]').click()
            time.sleep(0.05)
            
        expect(page_res.locator('.portrait-result')).to_be_visible()
        expect(page_res.locator('.portrait-result')).to_have_attribute('data-portrait', 'fox')
        
        # Check first screen Key Takeaway
        takeaway = page_res.locator('.portrait-key-takeaway')
        expect(takeaway).to_be_visible()
        expect(page_res.locator('.takeaway-badge')).to_have_text('★ 记住这条提醒')
        expect(page_res.locator('.takeaway-notice')).not_to_be_empty()
        
        # Check takeaway position within 844 viewport
        t_box = takeaway.bounding_box()
        print(f"390x844 Takeaway bottom: {t_box['y'] + t_box['height']}")
        assert t_box['y'] + t_box['height'] <= 844, f"Takeaway card below 844 fold: {t_box}"
        
        # Check opening analysis from first screen takeaway
        analysis_btn = takeaway.locator('button')
        expect(analysis_btn).to_be_visible()
        analysis_btn.click()
        expect(page_res.locator('#surveyAnalysis')).to_be_visible()
        page_res.keyboard.press('Escape')
        expect(page_res.locator('#surveyAnalysis')).not_to_be_visible()
        
        # Check dynamic fox reason specifying tied mechanisms
        reason_text = page_res.locator('.portrait-reason').inner_text()
        print(f"Fox tie reason text: {reason_text}")
        assert '承诺与实际落差' in reason_text and '预付与结算受阻' in reason_text, f"Expected dynamic fox reason with winning mechanisms, got: {reason_text}"

        # Check portrait why groups evidence under winning mechanisms
        why_el = page_res.locator('.portrait-why')
        expect(why_el).to_contain_text('【承诺与实际落差】')
        expect(why_el).to_contain_text('【预付与结算受阻】')
        expect(why_el).to_contain_text('先选两则对应案例')

        # Check secondary action (portrait card)
        card_btn = page_res.locator('[data-portrait-card]')
        expect(card_btn).to_be_visible()
        
        # Check 390x666 on result screen
        page_res.set_viewport_size({'width': 390, 'height': 666})
        t_box_short = takeaway.bounding_box()
        print(f"390x666 Result Takeaway top: {t_box_short['y']}, bottom: {t_box_short['y'] + t_box_short['height']}")
        assert t_box_short['y'] + t_box_short['height'] <= 666, f"Takeaway card below 666 fold on result screen: {t_box_short}"
        assert page_res.evaluate("document.documentElement.scrollWidth <= innerWidth")
        
        ctx_res.close()
        results['result_screen_takeaway'] = 'passed'
        
        # Test 4: All NO (bird) and All Skip (cloud) Takeaway
        for name, test_choices, role, badge in [
            ('bird_test', ['no']*8, 'bird', '★ 提前了解一条经验'),
            ('cloud_test', ['skip']*8, 'cloud', '★ 提前了解一条经验'),
        ]:
            ctx = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
            p_test = ctx.new_page()
            p_test.goto(URL)
            p_test.wait_for_load_state('networkidle')
            for c in test_choices:
                p_test.locator(f'[data-response="{c}"]').click()
                time.sleep(0.05)
            expect(p_test.locator('.portrait-result')).to_have_attribute('data-portrait', role)
            expect(p_test.locator('.takeaway-badge')).to_have_text(badge)
            expect(p_test.locator('.takeaway-notice')).not_to_be_empty()
            ctx.close()
            
        results['bird_and_cloud_takeaway'] = 'passed'

        # Test 5: Three-way tie (all YES) capacity notice check
        print("Testing three-way tie capacity notice...")
        ctx_tie3 = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        page_tie3 = ctx_tie3.new_page()
        page_tie3.goto(URL)
        page_tie3.wait_for_load_state('networkidle')
        for _ in range(8):
            page_tie3.locator('[data-response="yes"]').click()
            time.sleep(0.05)
        expect(page_tie3.locator('.portrait-result')).to_have_attribute('data-portrait', 'fox')
        why_tie3 = page_tie3.locator('.portrait-why')
        expect(why_tie3).to_contain_text('第三个维度的案例可继续在下方资料库查阅')
        ctx_tie3.close()
        results['three_way_tie_capacity'] = 'passed'

        browser.close()

except Exception as ex:
    import traceback
    traceback.print_exc()
    errors.append(str(ex))
finally:
    server.terminate()
    if TMP_DB.exists():
        try: TMP_DB.unlink()
        except: pass

print("Verification Results:", json.dumps(results, indent=2))
if errors:
    print("ERRORS:", errors)
    sys.exit(1)
print("ALL BROWSER VERIFICATIONS PASSED SUCCESSFULLY!")
