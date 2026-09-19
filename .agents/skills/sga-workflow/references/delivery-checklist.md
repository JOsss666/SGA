# Lista de verificación de entrega frontend

Usa únicamente los puntos aplicables al cambio realizado.

## Alcance y arquitectura

- El cambio permanece en el módulo solicitado y no modifica lógica, dependencias o estilos ajenos.
- Cada pieza nueva está ubicada como page, container o component según su responsabilidad.
- No se duplicaron componentes o tokens que ya existían y eran adecuados.

## Código y estilos

- Los archivos nuevos y sus identificadores siguen `camelCase`.
- Cada JSX visual nuevo tiene e importa su CSS homónimo.
- Cada selector local está bajo la clase raíz del archivo.
- El layout nuevo usa Flexbox; no se introdujo Grid sin petición explícita.
- Los colores, espaciados y tipografía consumen tokens CSS; no hay colores fijos locales nuevos.
- Light y dark conservan contraste, jerarquía y estados reconocibles.

## Experiencia

- La vista funciona en escritorio y se adapta sin scroll horizontal en anchos menores.
- Los controles tienen estados hover, focus, active y disabled cuando aplican.
- La interacción funciona con teclado y los controles con iconos tienen nombre accesible.
- Los flujos muestran los estados relevantes de carga, vacío y error.
- El contenido largo, valores inesperados y textos traducibles no rompen el layout.

## Verificación técnica

- Ejecuta los scripts disponibles del subproyecto afectado, priorizando lint, pruebas y build.
- Revisa visualmente el resultado cuando haya un entorno ejecutable.
- Informa qué se verificó, qué no pudo verificarse y cualquier riesgo residual concreto.
