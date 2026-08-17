# Memoria técnica del proyecto SGA

## Fechas y zonas horarias en controladores

Siempre que se cree, revise o modifique un controlador que escriba, filtre,
agrupe, exporte o presente fechas de negocio:

- Tratar `created_at` como un instante universal y conservarlo en
  `timestamp with time zone` (`timestamptz`), normalmente UTC.
- Obtener la zona IANA de la compañía desde
  `"Ecosystem".company_settings.time_zone`; no fijar una zona dentro del
  controlador ni deducirla únicamente del país.
- Reutilizar `api/services/businessTimeZoneService.js` para construir rangos de
  fecha comercial.
- Convertir la fecha inicial local a un instante UTC incluido y el día posterior
  a la fecha final a un instante UTC excluido: `created_at >= inicio` y
  `created_at < fin`.
- No usar `created_at::date`, `substring(0, 10)`, `split('T')[0]` ni restar horas
  manualmente para decidir el día comercial.
- Para presentación, devolver o calcular `created_at_local`, `business_date` y
  `business_time_zone` cuando el consumidor necesite la fecha comercial.
- Antes de convertir una columna existente, verificar si es `timestamptz` o
  `timestamp without time zone`. En particular,
  `"Facturation".shift_settlement_details.crated_at` es una columna legacy sin
  zona cuyos valores representan UTC, por lo que primero debe interpretarse con
  `AT TIME ZONE 'UTC'`.
- No reescribir datos históricos para corregir un problema de presentación o
  filtrado. Los cambios de esquema deben ser aditivos, respaldados y aplicados
  en una transacción.
- Incluir pruebas alrededor de medianoche y, cuando corresponda, zonas con
  horario de verano.

