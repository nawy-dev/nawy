"""
يولّد كل أيقونات التطبيق وملفات brand/svg من هندسة واحدة (الهوية الأساسية: شبكة الظهر أحادية اللون، brand/SPEC.md).

  python3 brand/make-derived-icons.py          (يحتاج Pillow)

يكتب:
  brand/svg/*.svg                 المصادر (أبيض على أسود، وأسود على أبيض: *-light)
  icon-192.png icon-512.png       أيقونات any (بلاطة مستديرة)
  maskable-icon.png               ماسكيبل: ملء كامل والعلامة داخل دائرة الأمان
  apple-touch-icon.png            180، مربعة معتمة
  favicon-16x16.png favicon-32x32.png favicon.ico   علامة أكبر للأحجام الصغيرة
  monochrome-icon.png             أسود على شفاف، داخل منطقة الأمان
  notification-badge.png          أبيض على شفاف
  brand/light/*.png               النسخة السوداء على البيضاء (غير منشورة)
"""
from PIL import Image, ImageDraw
import math
import os

PHI = (1 + 5 ** 0.5) / 2
T = 512.0
SS = 8
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
SVG_DIR = os.path.join(HERE, "svg")
LIGHT_DIR = os.path.join(HERE, "light")
BLACK, WHITE = "#000000", "#FFFFFF"

# خلايا العلامة (عمود، صف) في شبكة 3x3: النقطة أعلى الوسط ثم خمس خلايا على القاعدة والجانبين
CELLS = [(1, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)]
# أصغر دائرة تحيط بالخلايا الست: نصف قطرها 1.9004 خلية، ومركزها ثلث خلية تحت مركز الشبكة
CIRCLE_R = math.sqrt(2.25 + (1.5 - 1 / 3) ** 2)
CIRCLE_DY = 1 / 3


def mark_rects(width, centre=None):
    """مستطيلات العلامة على لوحة 512. width = عرض الشبكة؛ centre = (x, y) لمركز الشبكة."""
    c = width / 3
    cx, cy = centre or (T / 2, T / 2)
    x0, y0 = cx - width / 2, cy - width / 2
    return [(x0 + col * c, y0 + row * c, c, c) for col, row in CELLS]


def layout(kind):
    """يرجع (مستطيلات العلامة، نوع الخلفية) لكل نوع أيقونة."""
    if kind == "any":  # بلاطة مستديرة، العلامة = T/phi
        return mark_rects(T / PHI), "round"
    if kind == "square":  # ملء كامل (apple-touch)
        return mark_rects(T / PHI), "square"
    if kind == "small":  # <= 48px: علامة أكبر
        return mark_rects(T * 0.74), "round"
    if kind == "maskable":  # الدائرة المحيطة بالعلامة داخل 37% من العرض، أي أصغر من دائرة الأمان 40%
        c = 0.37 * T / CIRCLE_R
        return mark_rects(3 * c, (T / 2, T / 2 - CIRCLE_DY * c)), "square"
    if kind == "monochrome":  # أندرويد يقص الأيقونة الأحادية كأنها adaptive: دائرة أصغر (33%)
        c = 0.33 * T / CIRCLE_R
        return mark_rects(3 * c, (T / 2, T / 2 - CIRCLE_DY * c)), "none"
    if kind == "mark":  # علامة بلا خلفية
        return mark_rects(T / PHI), "none"
    if kind == "badge":  # شارة الإشعار: الشبكة 0.8 من اللوحة
        return mark_rects(T * 0.8), "none"
    raise ValueError(kind)


RADIUS = T / PHI ** 3  # نصف قطر زاوية البلاطة


def svg_text(kind, bg, fg):
    rects, shape = layout(kind)
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">']
    if shape == "round":
        r = RADIUS * (0.7 if kind == "small" else 1)
        out.append(f'<rect width="512" height="512" rx="{r:.2f}" fill="{bg}"/>')
    elif shape == "square":
        out.append(f'<rect width="512" height="512" fill="{bg}"/>')
    for x, y, w, h in rects:
        out.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fg}"/>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


def render(kind, size, bg, fg):
    rects, shape = layout(kind)
    s = size * SS / T
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if shape == "round":
        r = RADIUS * (0.7 if kind == "small" else 1) * s
        d.rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=r, fill=bg)
    elif shape == "square":
        d.rectangle([0, 0, size * SS - 1, size * SS - 1], fill=bg)
    for x, y, w, h in rects:
        d.rectangle([round(x * s), round(y * s), round((x + w) * s) - 1, round((y + h) * s) - 1], fill=fg)
    return img.resize((size, size), Image.LANCZOS)


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


os.makedirs(SVG_DIR, exist_ok=True)
os.makedirs(LIGHT_DIR, exist_ok=True)

# 1) مصادر SVG: داكن (أبيض على أسود) وفاتح (أسود على أبيض)
for kind, name in [("any", "app-icon"), ("square", "app-icon-square"), ("maskable", "app-icon-maskable"), ("small", "app-icon-small")]:
    write(os.path.join(SVG_DIR, name + ".svg"), svg_text(kind, BLACK, WHITE))
    write(os.path.join(SVG_DIR, name + "-light.svg"), svg_text(kind, WHITE, BLACK))
write(os.path.join(SVG_DIR, "mark-white.svg"), svg_text("mark", None, WHITE))
write(os.path.join(SVG_DIR, "mark-ink.svg"), svg_text("mark", None, BLACK))
write(os.path.join(SVG_DIR, "monochrome-icon.svg"), svg_text("monochrome", None, BLACK))
write(os.path.join(SVG_DIR, "notification-badge.svg"), svg_text("badge", None, WHITE))

# favicon.svg يتبدّل مع وضع المتصفح: بلاطة سوداء على تبويب فاتح، وبيضاء على تبويب داكن
small_rects, _ = layout("small")
r_small = RADIUS * 0.7
cells = "".join(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}"/>' for x, y, w, h in small_rects)
write(
    os.path.join(ROOT, "favicon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    "<style>.t{fill:#000}.m{fill:#fff}@media (prefers-color-scheme: dark){.t{fill:#fff}.m{fill:#000}}</style>"
    f'<rect class="t" width="512" height="512" rx="{r_small:.2f}"/><g class="m">{cells}</g></svg>\n',
)

# 2) PNG المنشورة
render("any", 192, BLACK, WHITE).save(os.path.join(ROOT, "icon-192.png"))
render("any", 512, BLACK, WHITE).save(os.path.join(ROOT, "icon-512.png"))
render("maskable", 512, BLACK, WHITE).save(os.path.join(ROOT, "maskable-icon.png"))
render("square", 180, BLACK, WHITE).convert("RGB").save(os.path.join(ROOT, "apple-touch-icon.png"))
render("small", 16, BLACK, WHITE).save(os.path.join(ROOT, "favicon-16x16.png"))
render("small", 32, BLACK, WHITE).save(os.path.join(ROOT, "favicon-32x32.png"))
ico = [render("small", n, BLACK, WHITE) for n in (16, 32, 48)]
ico[-1].save(os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:-1])
render("monochrome", 512, BLACK, BLACK).save(os.path.join(ROOT, "monochrome-icon.png"))
render("badge", 96, WHITE, WHITE).save(os.path.join(ROOT, "notification-badge.png"))

# 3) النسخة الفاتحة (أسود على أبيض) للاستخدام خارج التطبيق
render("any", 512, WHITE, BLACK).save(os.path.join(LIGHT_DIR, "icon-512.png"))
render("maskable", 512, WHITE, BLACK).save(os.path.join(LIGHT_DIR, "maskable-512.png"))
print("done")
