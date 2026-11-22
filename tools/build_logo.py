"""Gera o logo AmazonControl em SVG (marca + logotipo) a partir de geometria simples.

Recriação fiel ao manual da marca: monolinha arredondada (x-height 100, traço 25).
Se a agência enviar o SVG oficial, basta substituir os arquivos em assets/.
Uso: python3 tools/build_logo.py
"""
import math, os

S = 29.0          # espessura do traço
h = S / 2
R = (100 - S) / 2  # raio da linha central das letras redondas

def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")

def circle(cx, cy, r):
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 0 {f(2*r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2*r)} 0"

def glyph(ch, x):
    """Retorna (path_d, largura) da linha central do caractere, com base em y=100 e topo em y=0."""
    if ch == "o":
        return circle(x + 50, 50, R), 100
    if ch == "a":
        return circle(x + 50, 50, R) + f"M{f(x + 100 - h)} 0V100", 100
    if ch == "n":
        return f"M{f(x + h)} 0V100M{f(x + h)} 50A{f(50 - h)} {f(50 - h)} 0 0 1 {f(x + 100 - h)} 50V100", 100
    if ch == "m":
        rm = 30.0; cy = rm + h
        a, b, c = x + h, x + h + 2 * rm, x + h + 4 * rm
        return (f"M{f(a)} 0V100M{f(a)} {f(cy)}A{f(rm)} {f(rm)} 0 0 1 {f(b)} {f(cy)}V100"
                f"M{f(b)} {f(cy)}A{f(rm)} {f(rm)} 0 0 1 {f(c)} {f(cy)}V100"), c - x + h
    if ch == "z":
        return f"M{f(x)} {f(h)}H{f(x + 76)}L{f(x + 8)} {f(100 - h)}H{f(x + 84)}", 84
    if ch == "c":
        cx, cy, t = x + 50, 50, math.radians(40)
        x1, y1 = cx + R * math.cos(t), cy - R * math.sin(t)
        x2, y2 = cx + R * math.cos(t), cy + R * math.sin(t)
        return f"M{f(x1)} {f(y1)}A{f(R)} {f(R)} 0 1 0 {f(x2)} {f(y2)}", 88
    if ch == "t":
        return f"M{f(x + 22)} -26V100M{f(x)} {f(h)}H{f(x + 50)}", 50
    if ch == "r":
        rr = 50 - h
        return f"M{f(x + h)} 0V100M{f(x + h)} 50A{f(rr)} {f(rr)} 0 0 1 {f(x + 50)} {f(h)}H{f(x + 58)}", 58
    if ch == "l":
        rr = 32
        return f"M{f(x + h)} -26V{f(100 - h - rr)}A{f(rr)} {f(rr)} 0 0 0 {f(x + h + rr)} {f(100 - h)}H{f(x + 54)}", 54
    raise ValueError(ch)

def word(text, x0, y0, gap):
    d, x = [], x0
    for ch in text:
        g, w = glyph(ch, x)
        d.append(g)
        x += w + gap
    return "".join(d), x - gap

def translate_path(d, dy):
    return d  # paths são posicionados com <g transform>

def mark_inner(uid):
    """Marca (gota + mira) numa caixa 0..100."""
    cx, cy, rr = 49, 50, 29.5
    parts = []
    for ang in (225, 315, 135):
        a = math.radians(ang)
        parts.append(f"M{f(cx + 24 * math.cos(a))} {f(cy + 24 * math.sin(a))}L{f(cx + 36 * math.cos(a))} {f(cy + 36 * math.sin(a))}")
    a = math.radians(45)
    handle = f"M{f(cx + 23 * math.cos(a))} {f(cy + 23 * math.sin(a))}L{f(cx + 62 * math.cos(a))} {f(cy + 62 * math.sin(a))}"
    shape = "M0 0H50A50 50 0 0 1 100 50A50 50 0 0 1 50 100A50 50 0 0 1 0 50Z"
    x = f"M{cx-4} {cy-4}L{cx+4} {cy+4}M{cx-4} {cy+4}L{cx+4} {cy-4}"
    return f'''<defs><linearGradient id="{uid}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--logo-b1, #2563c7)"/><stop offset="1" stop-color="var(--logo-b2, #3d8bdd)"/></linearGradient><clipPath id="{uid}c"><path d="{shape}"/></clipPath></defs>
<path class="ac-shape" d="{shape}" fill="url(#{uid}g)"/>
<g class="ac-cross" fill="none" stroke="var(--logo-detail, #f7f7f8)" stroke-linecap="round">
<circle cx="{cx}" cy="{cy}" r="{rr}" stroke-width="8.5"/>
<path d="{''.join(parts)}" stroke-width="12.5"/>
<path d="{handle}" stroke-width="9" stroke-linecap="butt" clip-path="url(#{uid}c)"/>
<path d="{x}" stroke-width="6"/>
</g>'''

def build(variant):
    amazon, aw = word("amazon", 0, 0, 10)
    control, cw = word("control", 0, 0, 5)
    mark_size = 258
    tx = mark_size + 42
    tag_x = tx + cw + 18
    total_w = max(tx + aw, tag_x + 160)
    word_dark = "var(--logo-ink, #05172b)" if variant == "dark-text" else "var(--logo-ink, #ffffff)"
    tag = "".join(f'<tspan x="{f(tag_x)}" dy="{dy}">{t}</tspan>' for t, dy in (("CONTROLE", 0), ("DE PRAGAS", 27), ("URBANAS", 27)))
    body = f'''<g transform="translate(0 -14) scale(2.58)">{mark_inner("acl" + variant[0])}</g>
<g fill="none" stroke-width="{f(S)}" stroke-linejoin="miter" stroke-miterlimit="4">
<path d="{amazon}" transform="translate({f(tx)} 0)" stroke="var(--logo-blue, #3a86dc)"/>
<path d="{control}" transform="translate({f(tx)} 128)" stroke="{word_dark}"/>
</g>
<text x="{f(tag_x)}" y="156" fill="{word_dark}" font-family="Urbanist, Arial, sans-serif" font-weight="800" font-size="26" letter-spacing=".2">{tag}</text>'''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -38 {f(total_w + 4)} 296" role="img" aria-label="AmazonControl — Controle de Pragas Urbanas">\n{body}\n</svg>\n', total_w

os.makedirs("assets", exist_ok=True)
svg, w = build("dark-text")
open("assets/logo.svg", "w").write(svg)
svg2, _ = build("white-text")
open("assets/logo-white.svg", "w").write(svg2)
open("assets/logo-mark.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 102 102" role="img" aria-label="AmazonControl">\n{mark_inner("acm")}\n</svg>\n')
print("ok, largura", round(w))
