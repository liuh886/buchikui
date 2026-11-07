"""Manual integration: run against an isolated SURVEY_RESPONSE_DB preview, never live answers."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('PORTRAIT_TEST_URL', 'http://localhost:4190/')
OUTPUT = Path('docs/prototype-assets/2026-10-24/implementation')
OUTPUT.mkdir(parents=True, exist_ok=True)
results = []
errors = []

def no_overflow(page):
    if not page.evaluate('document.documentElement.scrollWidth <= innerWidth'):
        print('Overflow:', page.evaluate('''()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right})).filter(e=>e.right>innerWidth+1).slice(0,12)'''))
        raise AssertionError('horizontal overflow')

def answer(page, choices):
    for index, choice in enumerate(choices):
        expect(page.locator('.survey-step')).to_have_text(f'{index+1} / 8')
        page.locator(f'[data-response="{choice}"]').click()
    expect(page.locator('.portrait-result')).to_be_visible()

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    for role, choices in [
        ('otter', ['yes'] + ['no']*7),
        ('capybara', ['no','yes','no','no','no','no','no','no']),
        ('raccoon', ['no','no','yes','no','no','no','no','no']),
        ('fox', ['yes']*8),
        ('bird', ['no']*8),
        ('cloud', ['skip']*8),
    ]:
        context = browser.new_context(viewport={'width':390,'height':844}, reduced_motion='reduce', accept_downloads=True)
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_load_state('networkidle')
        print('Rendered controls:', page.get_by_role('button').all_text_contents()[:8])
        expect(page.locator('#surveyCard')).to_be_visible()
        no_overflow(page)
        if role == 'otter':
            page.screenshot(path=str(OUTPUT/'question-390.png'), full_page=True)
            before = page.evaluate('localStorage.getItem("buchikui-survey-v1")')
            page.get_by_role('button', name='案例解析', exact=True).click()
            expect(page.locator('#surveyAnalysis')).to_be_visible()
            page.keyboard.press('Escape')
            assert page.evaluate('localStorage.getItem("buchikui-survey-v1")') == before
        answer(page, choices)
        expect(page.locator('.portrait-result')).to_have_attribute('data-portrait',role)
        assert page.locator('.portrait-lesson').count() == 2
        page.locator('.portrait-art img').wait_for(state='visible')
        assert page.locator('.portrait-art img').evaluate('(img)=>img.complete && img.naturalWidth===512')
        no_overflow(page)
        page.screenshot(path=str(OUTPUT/f'{role}-390.png'),full_page=True)
        page.reload();page.wait_for_load_state('networkidle')
        expect(page.locator('.portrait-result')).to_have_attribute('data-portrait',role)
        page.get_by_role('button',name='读完整案例',exact=True).first.click()
        expect(page.locator('#surveyAnalysis')).to_be_visible()
        page.keyboard.press('Escape')
        if role == 'otter':
            page.locator('[data-portrait-card]').click()
            expect(page.locator('.portrait-share')).to_be_visible(timeout=15000)
            expect(page.locator('.portrait-share img')).to_be_visible()
            page.screenshot(path=str(OUTPUT/'share-390.png'),full_page=True)
            with page.expect_download() as download:
                page.get_by_role('link',name='保存图片',exact=True).click()
            download.value.save_as(str(OUTPUT/'otter-share.png'))
            page.get_by_role('button',name='关闭预览',exact=True).click()
            expect(page.locator('[data-portrait-card]')).to_be_focused()
            page.get_by_role('button',name='上一题',exact=True).click()
            expect(page.locator('.survey-step')).to_have_text('8 / 8')
            page.locator('[data-response="yes"]').click()
            expect(page.locator('.portrait-result')).to_have_attribute('data-portrait','otter')
            page.set_viewport_size({'width':1365,'height':900})
            page.screenshot(path=str(OUTPUT/'result-desktop.png'),full_page=True)
            no_overflow(page)
        if role == 'cloud':
            assert '还没遇到' not in page.locator('.portrait-lessons').inner_text()
        # The installed PWA must include the whole portrait style/character manifest.
        page.evaluate('navigator.serviceWorker.ready.then(()=>true)')
        page.reload();page.wait_for_load_state('networkidle')
        context.set_offline(True)
        page.reload();page.wait_for_load_state('domcontentloaded')
        expect(page.locator('.portrait-result')).to_have_attribute('data-portrait',role)
        assert page.locator('.portrait-art img').evaluate('(img)=>img.complete && img.naturalWidth===512')
        assert page.locator('.portrait-hero').evaluate('(e)=>getComputedStyle(e).textAlign') == 'center'
        no_overflow(page)
        context.set_offline(False)
        results.append({'role':role,'mobile':True,'restore':True,'analysis':True,'offline':True})
        context.close()
    context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    page=context.new_page();page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL+'?question=survey-secondhand-business');page.wait_for_load_state('networkidle')
    expect(page.locator('.survey-step')).to_have_text('1 / 8')
    expect(page.get_by_role('button',name='看对应案例')).to_be_visible()
    page.get_by_role('button',name='看对应案例').click();expect(page.locator('#surveyAnalysis')).to_be_visible();page.keyboard.press('Escape')
    # Malformed old local state must not prevent answering.
    page.evaluate('''()=>{const d=JSON.parse(localStorage.getItem('buchikui-survey-v1'));d.state.index=1;d.state.responses=[null];localStorage.setItem('buchikui-survey-v1',JSON.stringify(d));}''')
    page.goto(URL);page.wait_for_load_state('networkidle');expect(page.locator('.survey-step')).to_have_text('1 / 8')
    answer(page,['no']*8)
    page.route('**/portraits/*.webp',lambda route:route.abort())
    page.evaluate('''()=>{const img=document.querySelector('.portrait-art img');img.src='portraits/missing.webp';}''')
    expect(page.locator('.portrait-art-fallback')).to_be_visible()
    expect(page.get_by_role('heading',name='初见小团雀')).to_be_visible()
    context.close()
    context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    page=context.new_page();page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL+'buchikui/');page.wait_for_load_state('networkidle')
    for index in range(8):
        expect(page.locator('.survey-step')).to_have_text(f'{index+1} / 8')
        page.locator('#surveyCard').focus();page.keyboard.press('ArrowLeft')
    expect(page.locator('.portrait-result')).to_have_attribute('data-portrait','bird')
    assert '/buchikui/portraits/' in page.locator('.portrait-art img').get_attribute('src')
    no_overflow(page)
    page.evaluate("document.body.style.zoom='2'")
    no_overflow(page)
    page.screenshot(path=str(OUTPUT/'result-200-percent.png'),full_page=True)
    page.evaluate("document.body.style.zoom='1'")
    page.set_viewport_size({'width':320,'height':640});no_overflow(page)
    page.screenshot(path=str(OUTPUT/'result-320.png'),full_page=True)
    context.close()
    # Open the actual original sources in Chromium, independently of Node TLS.
    source_results=[]
    for source_url in [
        'https://whhlyt.hunan.gov.cn/whhlyt/scjg/zfjc/202606/t20260615_34002094.html',
        'https://www.court.gov.cn/shenpan/xiangqing/350961.html',
        'https://www.court.gov.cn/zixun/xiangqing/459331.html',
    ]:
        context=browser.new_context();source_page=context.new_page()
        try:
            response=source_page.goto(source_url,wait_until='domcontentloaded',timeout=20000)
            source_results.append({'url':source_url,'status':response.status if response else None,'title':source_page.title()})
        except Exception as e:
            source_results.append({'url':source_url,'error':str(e).splitlines()[0]})
        context.close()
    (OUTPUT/'source-links-browser.json').write_text(json.dumps(source_results,ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()

assert not errors, errors
(OUTPUT/'browser-results.json').write_text(json.dumps({'url':URL,'results':results,'pageErrors':errors,'deepLink':True,'corruptState':True,'imageFallback':True,'keyboard':True,'subpath':True,'cssZoom200':True,'width320':True},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'roles':len(results),'pageErrors':errors,'status':'passed'},ensure_ascii=False))
