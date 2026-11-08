"""Read-only library smoke test; the local preview must already be running."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('LIBRARY_TEST_URL', 'http://localhost:4194/')
OUTPUT = Path(os.environ.get('LIBRARY_TEST_OUTPUT', str(Path(os.environ['TEMP']) / 'buchikui-library-check')))
OUTPUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    errors = []
    context = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    context.route('**/api/survey-responses', lambda route: route.abort())
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL + '?view=library')
    page.wait_for_load_state('networkidle')
    expect(page.get_by_role('heading', name='案例库', exact=True)).to_be_visible()
    expect(page.locator('[data-topic]')).to_have_count(18)
    page.screenshot(path=str(OUTPUT / '01-directory-390.png'), full_page=True)
    page.get_by_role('button', name='售假', exact=True).click()
    expect(page.locator('#libraryResults')).to_be_visible()
    expect(page.locator('#topicList')).to_be_hidden()
    link = page.locator('.library-result h3 a').filter(has_text='二手').first
    expect(link).to_contain_text('二手')
    target = link.get_attribute('href')
    assert '#case-' in target
    page.screenshot(path=str(OUTPUT / '02-search-390.png'), full_page=True)
    page.reload()
    expect(page.locator('#caseSearch')).to_have_value('售假')
    page.locator('.library-result h3 a').filter(has_text='二手').first.click()
    expect(page.locator('#' + target.split('#')[1])).to_be_visible()
    assert page.locator('#' + target.split('#')[1]).bounding_box()['y'] < 844
    page.go_back()
    expect(page.locator('#caseSearch')).to_have_value('售假')
    page.get_by_text('按条件筛选', exact=True).click()
    page.get_by_role('button', name='通信', exact=True).click()
    expect(page.locator('#emptyState')).to_be_visible()
    expect(page.locator('#libraryResults')).to_be_hidden()
    page.get_by_role('button', name='清空搜索与筛选', exact=True).last.click()
    expect(page.locator('#topicList')).to_be_visible()
    expect(page.locator('#emptyState')).to_be_hidden()
    page.locator('#caseSearch').fill('二手 售假')
    expect(page.locator('.library-result')).to_have_count(1)
    for width in [320, 390, 1365]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
    page.screenshot(path=str(OUTPUT / '03-search-desktop.png'), full_page=True)
    page.locator('#caseSearch').fill('<img src=x onerror=alert(1)>')
    expect(page.locator('#emptyState')).to_be_visible()
    expect(page.locator('#libraryResultList img')).to_have_count(0)
    page.locator('#caseSearch').fill('银行理财')
    expect(page.locator('#libraryResults')).to_be_visible()
    page.get_by_role('button', name='清空搜索，浏览目录', exact=True).click()
    expect(page.locator('#topicList')).to_be_visible()
    assert not errors, errors
    print(f'Library checks passed: directory, search, anchors, filters, URL restore, 320/390/1365px, pageErrors=0. Screenshots: {OUTPUT}')
    browser.close()
