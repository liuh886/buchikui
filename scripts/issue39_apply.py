from pathlib import Path

path = Path('styles.css')
text = path.read_text(encoding='utf-8')

old = """  box-shadow:var(--shadow);\n  overflow:hidden;\n}\n"""
new = """  box-shadow:var(--shadow);\n  overflow:hidden;\n  overscroll-behavior:contain;\n}\n"""
if old not in text:
    raise SystemExit('base case switcher popover anchor missing')
text = text.replace(old, new, 1)

old = """  .top-actions{display:none}\n\n  .case-switcher{margin-left:auto;max-width:calc(100vw - 118px)}\n"""
new = """  .top-actions{display:none}\n  body.case-switcher-open{overflow:hidden}\n\n  .case-switcher{margin-left:auto;max-width:calc(100vw - 118px)}\n"""
if old not in text:
    raise SystemExit('mobile switcher scroll-lock anchor missing')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
