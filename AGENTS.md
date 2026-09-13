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

## Desarrollo frontend y UI/UX

- Para cualquier cambio de frontend, interfaz visual, experiencia de usuario o interacción dentro de SGA, usa siempre la skill `sga-workflow` como flujo principal.
- En esos mismos cambios, usa también la skill `ui-ux-pro-max` como apoyo de diseño, accesibilidad, responsive, interacción, tipografía, color y calidad visual.
- Sigue primero las instrucciones explícitas del usuario y las convenciones existentes del módulo afectado. Si hay conflicto, prevalecen las reglas del repositorio y de `sga-workflow`.
- Antes de modificar JSX o CSS, identifica el módulo exacto y lee las referencias requeridas por `sga-workflow`.
- Para tareas exclusivamente de backend, base de datos, infraestructura o lógica sin impacto visual, no uses `ui-ux-pro-max`; aplica las herramientas y prácticas pertinentes a esa tarea.

## Alcance

Estas instrucciones aplican a todo el árbol del repositorio `/Users/camm/Documents/SGA`.

## Servidor local

- Cuando el usuario pida iniciar, levantar, ejecutar o reiniciar "el servidor", interpreta que se refiere al backend global de SGA.
- Ejecuta siempre `npm run server-dev` con el directorio de trabajo `/Users/camm/Documents/SGA`, sin importar qué módulo esté activo o sea el tema de la conversación.
- No confundas "el servidor" con el servidor de desarrollo Vite de un módulo. Inicia Vite únicamente cuando el usuario pida explícitamente el frontend, la interfaz o el módulo web.

## Flujo Git

- Cuando el usuario diga "actualizar los cambios", ejecuta `git pull origin test` desde la raíz `/Users/camm/Documents/SGA`.
- Cuando el usuario diga "enviar cambios", crea un pull request con la rama `test` como destino (base).
- Nunca dirijas un pull request a `main` dentro de este flujo. Antes de crear el PR, confirma mediante una comprobación de solo lectura que la rama base sea `test`.
