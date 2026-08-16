from pathlib import Path

p = Path('mobile-plan-case.js')
s = p.read_text()

replacements = {
    "ogTitle:'通讯费太贵，先把真实用量和可办方案对上。'": "ogTitle:'通讯费太贵，不换号也有选择权。'",
    "title:'通讯费太贵，<br>先把<em>用量和方案</em><br>对上。'": "title:'通讯费太贵，<br><em>不换号也有选择权</em>。'",
    "copy:'很多长期用户一直沿用多年前的套餐，而当前渠道可能已经有更低月租、更适合真实用量的方案或优惠。先把<strong>账单 → 用量 → 可办方案 → 客服工单 → 替代方案</strong>一项项对清，把每个月不必要的固定支出降下来。'": "copy:'<strong>“老用户不如狗”？</strong>很多长期用户一直沿用多年前的套餐，当前渠道可能已经有更低月租、更适合真实用量的方案或优惠。<strong>不换号也可以改套餐。</strong>'"
}

for old, new in replacements.items():
    if s.count(old) != 1:
        raise SystemExit(f'expected one match: {old}')
    s = s.replace(old, new, 1)

p.write_text(s)
