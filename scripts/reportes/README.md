# Reportes con estilo SGA360°

Plantilla reutilizable para generar reportes en PDF con la identidad visual de
SGA360° (encabezado con logo, pie de página, tipografías, tablas y cajas
destacadas).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `sga_report_style.py` | Módulo con el estilo. Impórtalo desde tus scripts. |
| `ejemplo_informe_cierres.py` | Ejemplo completo. Cópialo como punto de partida. |
| `assets/sga_logo.png` | Logo que se incrusta en el encabezado. |

## Requisitos

Solo necesita **reportlab**:

```bash
pip install reportlab
```

(Pillow únicamente si algún día quieres regenerar/reescalar el logo.)

## Uso rápido

```python
from sga_report_style import SgaReport, P, heading, callout, table, bullets, small

r = SgaReport(
    out_path="mi_reporte.pdf",
    title="Título del reporte",
    subtitle="Contexto · fecha · módulo",
    footer="Documento generado el 8 de octubre de 2026 · Confidencial",
)

r.add(callout("<b>En una frase:</b> idea principal del reporte."))
r.add(heading("1. Sección"))
r.add(P("Párrafo de cuerpo. Admite <b>negrita</b> e <i>itálica</i>."))

r.add(table(
    ["Concepto", "Efectivo", "Transferencia"],
    [
        ["Ventas del día", "$1.048.735", "$177.300"],
        ["Total", "$1.048.735", "$177.300"],
    ],
    col_widths=[0.56, 0.22, 0.22],   # proporciones del ancho útil
    align_right=[1, 2],               # columnas de valores a la derecha
    total_row=True,                   # resalta la última fila
))

r.add(bullets(["Primer punto", "Segundo punto"]))
r.build()
```

Correr el ejemplo:

```bash
python ejemplo_informe_cierres.py salida.pdf
```

## Helpers disponibles (`sga_report_style`)

- `SgaReport(out_path, title, subtitle, footer, brand)` → `.add(...)`, `.build()`
- `heading(texto)` — título de sección
- `P(texto, style=BODY)` — párrafo; `lead(texto)` — párrafo introductorio
- `callout(texto)` — caja destacada con barra lateral
- `table(header, rows, col_widths, align_right, total_row)` — tabla con estilo
- `bullets([...])` — lista con viñetas
- `small(texto)` — nota pequeña gris (pies de tabla)
- `spacer(mm)` — espacio vertical

## Paleta

Definida en `sga_report_style.py`: `INK` (texto/encabezado), `MUTE` (secundario),
`LINE` (bordes), `SOFT` (filas alternas), `GOOD`/`GOODBG` (fila total), `CALLBG`
(caja destacada). Cambia esas constantes para ajustar el tema sin tocar el resto.
```
