# -*- coding: utf-8 -*-
"""
Ejemplo de uso de la plantilla de reportes SGA360°.

Genera el "Informe de hallazgos — Diferencias en cierres de caja".
Úsalo como plantilla: copia este archivo, cambia el contenido y listo.

    python ejemplo_informe_cierres.py [ruta_salida.pdf]
"""
import sys
from sga_report_style import SgaReport, P, heading, callout, table, bullets, small


def build(out_path):
    r = SgaReport(
        out_path=out_path,
        title="Informe de hallazgos",
        subtitle="Diferencias en cierres de caja · 30 sep – 1 oct 2026",
        footer="Documento generado el 8 de octubre de 2026 · Confidencial",
    )

    r.add(callout(
        "<b>En una frase:</b> el dinero está completo y bien registrado; "
        "las diferencias se deben a que varias ventas del 1 de octubre quedaron "
        "asociadas al <b>turno de caja equivocado</b>, por lo que no aparecieron "
        "en el cierre de ese día."))

    r.add(heading("1. Resumen ejecutivo"))
    r.add(P(
        "Al comparar el cierre de caja del 1 de octubre descargado del sistema contra el "
        "documento de ventas del negocio, se identificaron dos diferencias. Tras una revisión "
        "detallada de los registros, se confirmó que <b>no hay pérdida de dinero ni montos "
        "errados</b>: todas las ventas están registradas en el sistema con su valor correcto. "
        "Lo que ocurrió es que algunas ventas de la mañana del 1 de octubre se contabilizaron "
        "bajo turnos de caja distintos al del día, de modo que el cierre del 1 quedó incompleto."))

    r.add(heading("2. Las diferencias reportadas"))
    r.add(table(
        ["Diferencia reportada", "Valor", "Explicación"],
        [
            ["Cierre descargado vs. documento de ventas", "$193.700",
             "Ventas en efectivo del 1 de octubre que no entraron al cierre de ese día."],
            ["Transferencias del 1 de octubre", "$54.780",
             "El sistema reporta $177.300 y los soportes suman $232.080."],
        ],
        col_widths=[0.40, 0.16, 0.44],
        align_right=[1],
    ))

    r.add(heading("3. ¿Por qué ocurrió?"))
    r.add(P(
        "El sistema agrupa cada venta dentro de un <b>turno de caja</b> (la jornada que se abre "
        "y se cierra en el punto de venta). Se detectaron dos situaciones que, combinadas, "
        "produjeron las diferencias:"))
    r.add(P(
        "<b>a) La caja no se cerró la noche del 30 de septiembre.</b> El turno siguió abierto "
        "hasta la mañana del 1 de octubre, por lo que las primeras ventas del 1 quedaron "
        "sumadas al cierre del 30."))
    r.add(P(
        "<b>b) Algunas ventas se registraron en un turno antiguo.</b> Otras ventas del 1 de "
        "octubre (incluidas las transferencias) quedaron asociadas a un turno de caja ya "
        "cerrado desde agosto, perteneciente a otro punto de venta. Esto sucede cuando la "
        "pantalla de ventas conserva un turno anterior en memoria al registrar el pago."))

    r.add(heading("4. A dónde fueron las ventas del 1 de octubre"))
    r.add(table(
        ["Turno donde quedó registrada la venta", "Efectivo", "Transferencia"],
        [
            ["Turno del día 1 de octubre (cierre oficial)", "$1.048.735", "$0"],
            ["Turno que quedó abierto desde el 30 de sep.", "$169.700", "$0"],
            ["Turno antiguo (otro punto de venta, cerrado en agosto)", "$24.000", "$177.300"],
            ["Total de ventas del 1 de octubre en el sistema", "$1.242.435", "$177.300"],
        ],
        col_widths=[0.56, 0.22, 0.22],
        align_right=[1, 2],
        total_row=True,
    ))
    r.add(small(
        "Los <b>$193.700</b> de diferencia corresponden exactamente al efectivo del 1 de octubre "
        "que quedó fuera del cierre del día: $169.700 del turno abierto desde el 30 más $24.000 "
        "del turno antiguo. Las transferencias del día ($177.300) también cayeron en ese turno "
        "antiguo, por eso no figuran en el cierre del 1."))

    r.add(heading("5. Sobre la diferencia en transferencias ($54.780)"))
    r.add(P(
        "Los soportes de transferencia suman $232.080 y el sistema registra $177.300. La "
        "diferencia de <b>$54.780</b> corresponde a transferencias que se recibieron pero que no "
        "quedaron registradas como transferencia del 1 de octubre en el sistema. Para identificar "
        "cada una, basta con cruzar los soportes (hora y valor) contra las facturas del día."))

    r.add(heading("6. Conclusión y recomendaciones"))
    r.add(P(
        "Las diferencias <b>no reflejan faltantes ni errores de monto</b>, sino ventas "
        "clasificadas en el turno de caja equivocado. Para evitar que se repita se recomienda:"))
    r.add(bullets([
        "Cerrar la caja al final de cada jornada, sin dejar turnos abiertos de un día para otro.",
        "Verificar, antes de registrar un pago, que el turno activo sea el del día en curso.",
        "Reubicar las ventas mal asignadas al turno correcto del 1 de octubre.",
        "Completar el registro de las transferencias faltantes ($54.780) a partir de los soportes.",
    ]))

    return r.build()


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Informe_Cierres_Caja_SGA360.pdf"
    print("Generado:", build(out))
