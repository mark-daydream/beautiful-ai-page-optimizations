#!/usr/bin/env python3
"""
Contrast audit for on-page optimization bundles (and any static microsite).

Renders every HTML page in headless Chromium, forces hidden tab panels open,
then walks every element that owns visible text and computes the WCAG contrast
ratio between its effective text color and the first opaque background behind
it. Anything under FAIL_RATIO is a defect (unreadable: e.g. black text on the
dark .schema-wrap card). Anything under WARN_RATIO is listed as a warning.

Usage:
  python3 scripts/contrast_audit.py <dir-or-html> [<dir-or-html> ...] [--fail 3.0] [--warn 4.5] [--json out.json]
  python3 scripts/contrast_audit.py https://example.vercel.app/slug/   (live URLs work too)

Exit code 1 when any page has a FAIL. Meant to run in Phase 10 (Definition of Done).
"""
import sys, json, pathlib, argparse
from playwright.sync_api import sync_playwright

JS = r"""
(function(failRatio, warnRatio){
  // open every tab panel / collapsed thing so hidden text gets measured too
  const st = document.createElement('style');
  // transitions off: review-ui applies its Firestore-loaded state asynchronously and a
  // mid-transition snapshot reports blended colors that never exist at rest
  st.textContent = '.tab-panel{display:block !important} #mockup-content{display:block !important} *{transition:none !important;animation:none !important}';
  document.head.appendChild(st);
  document.querySelectorAll('details').forEach(d => d.open = true);

  function parse(c){
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if(!m) return null;
    const p = m[1].split(',').map(s => parseFloat(s));
    return {r:p[0], g:p[1], b:p[2], a: p.length > 3 ? p[3] : 1};
  }
  function blend(fg, bg){ // composite fg over bg
    const a = fg.a;
    return {r: fg.r*a + bg.r*(1-a), g: fg.g*a + bg.g*(1-a), b: fg.b*a + bg.b*(1-a), a:1};
  }
  function lum(c){
    const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
  }
  function ratio(a, b){
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  }
  function effectiveBg(el){
    // walk up compositing translucent layers until an opaque one
    let acc = null, node = el, hasImage = false;
    while(node && node.nodeType === 1){
      const cs = getComputedStyle(node);
      if(cs.backgroundImage && cs.backgroundImage !== 'none') hasImage = true;
      const c = parse(cs.backgroundColor);
      if(c && c.a > 0){
        if(!acc) acc = c;
        else acc = blend(acc, c);
        if(acc.a >= 0.999 || c.a >= 0.999){ acc.a = 1; return {c:acc, img:hasImage}; }
      }
      node = node.parentElement;
    }
    const white = {r:255,g:255,b:255,a:1};
    return {c: acc ? blend(acc, white) : white, img:hasImage};
  }
  function ownText(el){
    let t = '';
    for(const n of el.childNodes) if(n.nodeType === 3) t += n.nodeValue;
    return t.replace(/\s+/g,' ').trim();
  }
  function selector(el){
    const parts = [];
    let n = el;
    while(n && n.nodeType === 1 && parts.length < 4){
      let s = n.tagName.toLowerCase();
      if(n.id) { s += '#' + n.id; parts.unshift(s); break; }
      if(n.classList.length) s += '.' + [...n.classList].slice(0,2).join('.');
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join(' > ');
  }
  const out = [];
  const seen = new Set();
  for(const el of document.querySelectorAll('body *')){
    if(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG','PATH'].includes(el.tagName)) continue;
    const text = ownText(el);
    if(text.length < 2) continue;
    const cs = getComputedStyle(el);
    if(cs.visibility === 'hidden' || cs.display === 'none') continue;
    // opacity chain
    let op = 1, n = el;
    while(n && n.nodeType === 1){ op *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; }
    if(op < 0.05) continue;
    const r = el.getBoundingClientRect();
    if(r.width < 1 || r.height < 1) continue;
    let fg = parse(cs.color); if(!fg) continue;
    const bgInfo = effectiveBg(el);
    if(fg.a < 1) fg = blend(fg, bgInfo.c);
    const cr = ratio(fg, bgInfo.c);
    if(cr >= warnRatio) continue;
    const sel = selector(el);
    const key = sel + '|' + cs.color + '|' + JSON.stringify(bgInfo.c);
    if(seen.has(key)) continue;
    seen.add(key);
    out.push({
      level: cr < failRatio ? 'FAIL' : 'WARN',
      ratio: Math.round(cr*100)/100,
      selector: sel,
      color: cs.color,
      background: 'rgb(' + Math.round(bgInfo.c.r) + ', ' + Math.round(bgInfo.c.g) + ', ' + Math.round(bgInfo.c.b) + ')',
      bgImage: bgInfo.img,
      text: text.slice(0, 80)
    });
  }
  out.sort((a,b) => a.ratio - b.ratio);
  return out;
})
"""

def collect(targets):
    pages = []
    for t in targets:
        if t.startswith('http://') or t.startswith('https://'):
            pages.append(t); continue
        p = pathlib.Path(t).expanduser().resolve()
        if p.is_file():
            pages.append(p.as_uri()); continue
        for f in sorted(p.rglob('*.html')):
            s = str(f)
            if any(x in s for x in ('/node_modules/', '/.firecrawl/', '/.vercel/', '/.git/', '/.claude/', '/.work/', '/workfiles', 'tools/')):
                continue
            pages.append(f.as_uri())
    return pages

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('targets', nargs='+')
    ap.add_argument('--fail', type=float, default=3.0)
    ap.add_argument('--warn', type=float, default=4.5)
    ap.add_argument('--json')
    ap.add_argument('--quiet-warn', action='store_true', help='only print FAILs')
    a = ap.parse_args()
    pages = collect(a.targets)
    results = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={'width': 1400, 'height': 900})
        pg = ctx.new_page()
        for url in pages:
            try:
                pg.goto(url, wait_until='load', timeout=30000)
                pg.wait_for_timeout(1500)  # let review-ui pull saved decisions before measuring
                res = pg.evaluate(JS + f"({a.fail},{a.warn})")
            except Exception as e:
                res = [{'level': 'ERROR', 'ratio': 0, 'selector': '', 'color': '', 'background': '', 'text': str(e)[:120]}]
            results[url] = res
        b.close()
    fails = 0
    for url, res in results.items():
        f = [r for r in res if r['level'] == 'FAIL']
        w = [r for r in res if r['level'] == 'WARN']
        e = [r for r in res if r['level'] == 'ERROR']
        fails += len(f) + len(e)
        if not f and not e and (a.quiet_warn or not w):
            continue
        print(f"\n## {url}")
        for r in f + e + ([] if a.quiet_warn else w):
            print(f"  {r['level']:5} {r['ratio']:>5}  {r['selector']}  fg={r['color']} bg={r['background']}  \"{r['text']}\"")
    print(f"\n{len(pages)} pages scanned, {sum(1 for r in results.values() if any(x['level']=='FAIL' for x in r))} with FAIL, {fails} failing elements")
    if a.json:
        pathlib.Path(a.json).write_text(json.dumps(results, indent=1))
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
