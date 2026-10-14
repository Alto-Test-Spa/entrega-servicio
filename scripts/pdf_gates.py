"""Compuertas sobre el PDF real. Uso: pdf_gates.py <pdf> <manifest.json> <nombre>."""
import json, re, sys, unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader

pdf_path, manifest_path, name = sys.argv[1:4]
manifest = json.load(open(manifest_path, encoding="utf-8"))
reader = PdfReader(pdf_path)
doc = pdfium.PdfDocument(pdf_path)
errors = []

def squash(s):
    # NFKC deshace ligaduras (ﬁ → fi); sin espacios para tolerar cortes de línea dentro de una palabra;
    # en minúsculas porque el CSS usa text-transform: uppercase y el PDF trae el texto ya transformado.
    # Sin guiones: el texto va justificado con separación silábica (hyphens: auto) y el PDF trae el guion del corte.
    return re.sub(r"[\s\-\u00ad\u2010]+", "", unicodedata.normalize("NFKC", s)).lower()

FOOTER = re.compile(r"ALTO\s*TEST\s*·\s*EN-\d{8}-\d{6}|Página\s*\d+\s*de\s*\d+")
pages = [(p.extract_text() or "") for p in reader.pages]
n = len(pages)

# 1. Todas las hojas son Carta vertical.
for i, p in enumerate(reader.pages, 1):
    w, h = float(p.mediabox.width) / 72, float(p.mediabox.height) / 72
    if abs(w - 8.5) > 0.02 or abs(h - 11) > 0.02:
        errors.append(f"hoja {i}: {w:.2f}x{h:.2f} in (se esperaba 8.50x11.00)")

# 2. Ninguna hoja en blanco, y la portada sale a sangre (esquinas oscuras).
for i in range(n):
    img = doc[i].render(scale=0.5).to_pil().convert("L")
    w, h = img.size
    px = img.load()
    body = int(h * 0.88)  # sin la zona del pie
    rows = sum(1 for y in range(body) if any(px[x, y] < 200 for x in range(0, w, 3)))
    if rows < 5:
        errors.append(f"hoja {i + 1}: en blanco ({rows} filas con tinta)")
    if i == 0:
        corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
        if any(c > 110 for c in corners):
            errors.append(f"portada: no sale a sangre (esquinas {corners})")

# 3. Pie "Página n de N" correcto en todas las hojas menos la portada; la portada no lleva pie.
for i, text in enumerate(pages, 1):
    squashed = squash(text)
    expected = squash(f"Página {i} de {n}")
    if i == 1 and "Página" in text:
        errors.append("portada: lleva pie y no debería")
    if i > 1 and expected not in squashed:
        errors.append(f"hoja {i}: falta el pie 'Página {i} de {n}'")
    if i > 1 and squash("ALTO TEST · EN-") not in squashed:
        errors.append(f"hoja {i}: falta 'ALTO TEST · folio' en el pie")

body_pages = [squash(FOOTER.sub("", t)) for t in pages]
full = "".join(body_pages)

# 4. Todo el texto del documento aparece en el PDF (nada recortado).
missing = [c for c in manifest["chunks"] if squash(c) not in full]
if missing:
    errors.append(f"{len(missing)} fragmento(s) de texto no aparecen en el PDF, p. ej. {missing[0][:60]!r}")

# 5. Cada sección visible empieza en una hoja propia y en orden.
last = 0
for title in manifest["titles"]:
    idx = next((k for k, t in enumerate(body_pages, 1) if squash(title) in t and k > last), None)
    if idx is None:
        errors.append(f"la sección «{title}» no empieza en una hoja nueva posterior a la anterior")
        break
    last = idx

# 6. Ninguna fila de tabla ni cabecera de hallazgo (con su primera foto) queda partida entre hojas.
for group in manifest["groups"]:
    if not any(all(squash(part) in page for part in group) for page in body_pages):
        errors.append(f"queda partido entre hojas: {group[0][:50]!r}")

if errors:
    print(f"✗ {name}: {len(errors)} problema(s)")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print(f"✓ {name}: {n} hojas · Carta vertical · sin hojas en blanco · pie correcto · texto completo · sin filas partidas")
