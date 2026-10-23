# -*- coding: utf-8 -*-
"""
Estilo de reportes SGA360° (PDF).

Plantilla reutilizable para generar reportes con la identidad de SGA360°:
encabezado con logo, pie de página, tipografías y helpers de contenido
(párrafos, títulos, viñetas, tablas, cajas destacadas).

Uso mínimo
----------
    from sga_report_style import SgaReport, P, H2, callout, table, bullets

    r = SgaReport(
        out_path="mi_reporte.pdf",
        title="Informe de hallazgos",
        subtitle="Diferencias en cierres de caja · 30 sep – 1 oct 2026",
    )
    r.add(callout("<b>En una frase:</b> el dinero está completo..."))
    r.add(H2("1. Resumen ejecutivo"))
    r.add(P("Texto del resumen..."))
    r.add(table(
        ["Concepto", "Valor"],
        [["Efectivo", "$1.048.735"], ["Transferencia", "$177.300"]],
        col_widths=[0.7, 0.3],          # proporciones del ancho útil
        align_right=[1],                 # columnas alineadas a la derecha
        total_row=True,                  # resalta la última fila como total
    ))
    r.build()

Requisitos: reportlab (y Pillow solo si se regenera el logo).
"""

import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, XPreformatted)
from reportlab.lib.utils import ImageReader

# --------------------------------------------------------------------------- #
# Identidad visual
# --------------------------------------------------------------------------- #
INK    = colors.HexColor("#0B0B0F")   # texto principal / barra del encabezado
MUTE   = colors.HexColor("#5B5F66")   # texto secundario
LINE   = colors.HexColor("#E3E5E9")   # bordes de tabla
SOFT   = colors.HexColor("#F5F6F8")   # filas alternas
GOOD   = colors.HexColor("#0F8A4D")   # acento positivo (fila total)
GOODBG = colors.HexColor("#EAF6EF")
WARN   = colors.HexColor("#B4541A")
CALLBG = colors.HexColor("#EEF2FB")   # fondo de caja destacada

# Paleta para bloques de código (JSON de ejemplo)
CODE_BG      = colors.HexColor("#0B0B0F")   # fondo del bloque
CODE_FG      = "#C9D1D9"                     # texto / puntuación
CODE_KEY     = "#E6EDF3"                     # claves
CODE_STR     = "#7EE787"                     # valores string
CODE_NUM     = "#79C0FF"                     # números / null / booleanos
CODE_COMMENT = "#8B949E"                     # comentarios //

PAGE_W, PAGE_H = A4
LMAR = 18 * mm
RMAR = 18 * mm
TOPMAR = 34 * mm
BOTMAR = 20 * mm

_LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "assets", "sga_logo.png")
_LOGO_IMG = ImageReader(_LOGO_PATH) if os.path.exists(_LOGO_PATH) else None

# --------------------------------------------------------------------------- #
# Estilos de texto
# --------------------------------------------------------------------------- #
_ss = getSampleStyleSheet()

H2 = ParagraphStyle("SGA_H2", parent=_ss["Heading2"], fontName="Helvetica-Bold",
                    fontSize=12.5, textColor=INK, spaceBefore=12, spaceAfter=5,
                    leading=15)
BODY = ParagraphStyle("SGA_BODY", parent=_ss["Normal"], fontName="Helvetica",
                      fontSize=10, textColor=INK, leading=15.2,
                      alignment=TA_JUSTIFY, spaceAfter=6)
LEAD = ParagraphStyle("SGA_LEAD", parent=BODY, fontSize=10.5, leading=16)
SMALL = ParagraphStyle("SGA_SMALL", parent=BODY, fontSize=8.6, textColor=MUTE,
                       leading=11.5, alignment=TA_LEFT, spaceAfter=0)
_TH  = ParagraphStyle("SGA_TH", parent=_ss["Normal"], fontName="Helvetica-Bold",
                      fontSize=9, textColor=colors.white, leading=11)
_TD  = ParagraphStyle("SGA_TD", parent=_ss["Normal"], fontName="Helvetica",
                      fontSize=9, textColor=INK, leading=12)
_TDb = ParagraphStyle("SGA_TDb", parent=_TD, fontName="Helvetica-Bold")
_TDr = ParagraphStyle("SGA_TDr", parent=_TD, alignment=2)
_TDrb= ParagraphStyle("SGA_TDrb", parent=_TDb, alignment=2)
CODE_STYLE = ParagraphStyle("SGA_CODE", parent=_ss["Normal"], fontName="Courier",
                            fontSize=7.5, textColor=colors.HexColor(CODE_FG),
                            leading=10.6)


# --------------------------------------------------------------------------- #
# Helpers de contenido
# --------------------------------------------------------------------------- #
def P(text, style=BODY):
    """Párrafo de cuerpo. Acepta marcado <b>, <i>, <super>, <sub>."""
    return Paragraph(text, style)


def heading(text):
    """Título de sección (estilo H2)."""
    return Paragraph(text, H2)


def lead(text):
    """Párrafo introductorio, un poco más grande."""
    return Paragraph(text, LEAD)


def small(text):
    """Nota pequeña, gris (para pies de tabla o aclaraciones)."""
    return Paragraph(text, SMALL)


def spacer(h_mm=4):
    return Spacer(1, h_mm * mm)


def bullets(items):
    """Devuelve una lista de flowables con viñetas."""
    st = ParagraphStyle("SGA_LI", parent=BODY, leftIndent=10, spaceAfter=4)
    return [Paragraph("•&nbsp;&nbsp;" + t, st) for t in items]


def callout(text, accent=INK, bg=CALLBG):
    """Caja destacada con barra lateral (para la conclusión principal)."""
    t = Table([[Paragraph(text, LEAD)]], colWidths=[PAGE_W - LMAR - RMAR])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
    ]))
    return t


# --- Bloque de código (JSON de ejemplo) ------------------------------------ #
_CODE_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")
_CODE_KW_RE = re.compile(r"\b(?:true|false|null)\b")


def _code_esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _code_plain(text):
    """Colorea números, null y booleanos en un tramo fuera de strings/comentarios."""
    s = _code_esc(text)
    s = _CODE_NUM_RE.sub(lambda m: '<font color="%s">%s</font>' % (CODE_NUM, m.group(0)), s)
    s = _CODE_KW_RE.sub(lambda m: '<font color="%s">%s</font>' % (CODE_NUM, m.group(0)), s)
    return s


def _code_hl_line(line):
    """Resalta una línea: claves, strings, números y comentarios // de fin de línea."""
    segs, i, n, start, in_str = [], 0, len(line), 0, False
    while i < n:
        ch = line[i]
        if in_str:
            if ch == '"' and line[i - 1] != "\\":
                j = i + 1
                while j < n and line[j] == " ":
                    j += 1
                kind = "key" if (j < n and line[j] == ":") else "str"
                segs.append((kind, line[start:i + 1]))
                in_str, i, start = False, i + 1, i + 1
                continue
            i += 1
            continue
        if ch == '"':
            if start < i:
                segs.append(("plain", line[start:i]))
            in_str, start = True, i
            i += 1
            continue
        if ch == "/" and i + 1 < n and line[i + 1] == "/":
            if start < i:
                segs.append(("plain", line[start:i]))
            segs.append(("comment", line[i:]))
            start = i = n
            break
        i += 1
    if start < n:
        segs.append(("plain", line[start:n]))

    out = []
    for kind, text in segs:
        if kind == "key":
            out.append('<font color="%s">%s</font>' % (CODE_KEY, _code_esc(text)))
        elif kind == "str":
            out.append('<font color="%s">%s</font>' % (CODE_STR, _code_esc(text)))
        elif kind == "comment":
            out.append('<font color="%s">%s</font>' % (CODE_COMMENT, _code_esc(text)))
        else:
            out.append(_code_plain(text))
    return "".join(out)


def code(src):
    """Bloque de código con fondo oscuro y resaltado básico (ideal para JSON de ejemplo)."""
    body = "\n".join(_code_hl_line(ln) for ln in src.replace("\t", "  ").split("\n"))
    para = XPreformatted(body, CODE_STYLE)
    t = Table([[para]], colWidths=[PAGE_W - LMAR - RMAR])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def table(header, rows, col_widths=None, align_right=None, total_row=False):
    """
    Tabla con estilo SGA.

    header       : lista de encabezados (str).
    rows         : lista de filas; cada fila es lista de str.
    col_widths   : proporciones que suman ~1 (p.ej. [0.6, 0.2, 0.2]).
                   Si es None, columnas iguales.
    align_right  : índices de columnas alineadas a la derecha (p.ej. valores).
    total_row    : si True, la última fila se resalta como total.
    """
    ncol = len(header)
    align_right = set(align_right or [])
    usable = PAGE_W - LMAR - RMAR
    if col_widths:
        widths = [usable * w for w in col_widths]
    else:
        widths = [usable / ncol] * ncol

    def cell(txt, col, is_total):
        if col in align_right:
            return Paragraph(txt, _TDrb if is_total else _TDr)
        return Paragraph(txt, _TDb if is_total else _TD)

    data = [[Paragraph(h, _TH) for h in header]]
    for i, row in enumerate(rows):
        is_total = total_row and i == len(rows) - 1
        data.append([cell(c, j, is_total) for j, c in enumerate(row)])

    t = Table(data, colWidths=widths)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    last_body = len(rows) - 1 if total_row else len(rows)
    if last_body > 0:
        style.append(("ROWBACKGROUNDS", (0, 1), (-1, last_body),
                      [colors.white, SOFT]))
    if total_row:
        style += [
            ("BACKGROUND", (0, -1), (-1, -1), GOODBG),
            ("LINEABOVE", (0, -1), (-1, -1), 1, GOOD),
        ]
    t.setStyle(TableStyle(style))
    return t


# --------------------------------------------------------------------------- #
# Documento + encabezado/pie
# --------------------------------------------------------------------------- #
class SgaReport:
    """
    Constructor de reportes con estilo SGA360°.

    Parámetros
    ----------
    out_path : ruta del PDF a generar.
    title    : título grande del encabezado.
    subtitle : subtítulo / contexto (fecha, módulo, etc.).
    footer   : texto del pie izquierdo (por defecto incluye 'Confidencial').
    brand    : nombre de marca mostrado a la derecha (por defecto 'SGA360°').
    """

    def __init__(self, out_path, title, subtitle="",
                 footer="Confidencial", brand="SGA360°"):
        self.out_path = out_path
        self.title = title
        self.subtitle = subtitle
        self.footer = footer
        self.brand = brand
        self.story = [Spacer(1, 6)]

    def add(self, flowable_or_list):
        if isinstance(flowable_or_list, (list, tuple)):
            self.story.extend(flowable_or_list)
        else:
            self.story.append(flowable_or_list)
        return self

    def _header_footer(self, c, doc):
        c.saveState()
        top = PAGE_H - 14 * mm
        # Título
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(LMAR, top - 4 * mm, self.title)
        if self.subtitle:
            c.setFont("Helvetica", 9.5)
            c.setFillColor(MUTE)
            c.drawString(LMAR, top - 9.6 * mm, self.subtitle)
        # Marca + logo (derecha)
        brand_x = PAGE_W - RMAR
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(INK)
        tw = c.stringWidth(self.brand, "Helvetica-Bold", 13)
        c.drawRightString(brand_x, top - 4.2 * mm, self.brand)
        if _LOGO_IMG is not None:
            r = 5.6 * mm
            cx, cy = brand_x - tw - 8.5 * mm, top - 2.6 * mm
            c.drawImage(_LOGO_IMG, cx - r, cy - r, width=2 * r, height=2 * r,
                        mask="auto", preserveAspectRatio=True)
        # Regla del encabezado
        c.setStrokeColor(INK)
        c.setLineWidth(1.4)
        c.line(LMAR, top - 14 * mm, PAGE_W - RMAR, top - 14 * mm)
        # Pie
        c.setStrokeColor(LINE)
        c.setLineWidth(0.8)
        c.line(LMAR, 14 * mm, PAGE_W - RMAR, 14 * mm)
        c.setFont("Helvetica", 8)
        c.setFillColor(MUTE)
        if self.footer:
            c.drawString(LMAR, 9.5 * mm, self.footer)
        c.drawRightString(PAGE_W - RMAR, 9.5 * mm, "Página %d" % doc.page)
        c.restoreState()

    def build(self):
        doc = SimpleDocTemplate(
            self.out_path, pagesize=A4,
            leftMargin=LMAR, rightMargin=RMAR,
            topMargin=TOPMAR, bottomMargin=BOTMAR,
            title=self.title, author="SGA360",
        )
        doc.build(self.story,
                  onFirstPage=self._header_footer,
                  onLaterPages=self._header_footer)
        return self.out_path
