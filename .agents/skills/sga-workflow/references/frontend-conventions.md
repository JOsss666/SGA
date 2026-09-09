# Convenciones frontend de SGA

Aplica estas reglas al código nuevo y a los archivos modificados dentro del alcance. El repositorio contiene código heredado que puede no cumplirlas: no realices migraciones masivas ni renombres archivos ajenos solo para uniformarlo.

## Stack

- Usa React con Vite y JavaScript/JSX, salvo que el subproyecto afectado demuestre otra configuración.
- Usa CSS vanilla compartimentado por archivo y scoping manual con clases.
- Respeta las dependencias y patrones ya instalados en el subproyecto. No agregues una librería para resolver algo razonable con el stack existente.

## Responsabilidades arquitectónicas

- `pages/`: vistas completas, secciones principales y rutas. Orquestan containers y el estado de alcance de la vista.
- `containers/`: secciones o flujos intermedios que coordinan componentes y estado específico.
- `components/`: unidades pequeñas y reutilizables, como botones, inputs, títulos, cards y badges.

Cuando el subproyecto use módulos u otra organización superior, conserva esa organización y aplica los tres niveles dentro del área compatible. No muevas código heredado entre capas si la tarea no lo requiere.

## Nombres y legibilidad

- Usa `camelCase` para variables, constantes, funciones y hooks.
- Usa nombres de archivo `camelCase` para los nuevos `.jsx` y `.css`, por ejemplo `primaryButton.jsx` y `primaryButton.css`.
- Usa clases CSS y selectores propios en `camelCase`.
- Conserva nombres públicos existentes cuando renombrarlos rompa imports, contratos o amplíe innecesariamente el cambio.
- Prefiere código autoexplicativo y consistente con el archivo cercano. Extrae abstracciones solo cuando reduzcan duplicación real o aclaren responsabilidades.

## Relación entre JSX y CSS

- Cada archivo JSX visual nuevo debe tener un CSS homónimo e importarlo, por ejemplo `primaryButton.jsx` importa `./primaryButton.css`.
- Si un archivo JSX no renderiza interfaz ni necesita estilos —por ejemplo un hook, provider o archivo de utilidades— no crees un CSS vacío.
- Al editar un componente heredado, conserva su pareja y nomenclatura actuales salvo que el alcance autorice renombrarlo.

## Scoping manual

La raíz renderizada debe incluir una clase igual al nombre base del archivo y cada selector local debe comenzar desde ella:

```jsx
import './userProfile.css';

export function UserProfile() {
  return (
    <section className="userProfile">
      <header className="userProfileHeader">...</header>
    </section>
  );
}
```

```css
.userProfile {
  display: flex;
}

.userProfile .userProfileHeader {
  display: flex;
}
```

- No declares selectores globales, etiquetas sueltas ni clases genéricas fuera de la raíz del archivo.
- Los estados, pseudo-clases y media queries deben conservar el selector raíz.
- Los estilos verdaderamente globales —reset, tokens y temas— pertenecen únicamente al archivo global ya establecido por el subproyecto.

## Layout y responsive

- Usa Flexbox como motor de layout por defecto.
- No introduzcas CSS Grid salvo solicitud explícita del usuario. No reemplaces Grid heredado fuera del alcance.
- Diseña desktop-first: define primero la experiencia de escritorio y adapta con breakpoints descendentes claros.
- Evita anchos rígidos que provoquen scroll horizontal. Valida contenido largo, zoom y tamaños intermedios, no solo un ancho móvil final.

## Tokens y temas

- Consume variables CSS existentes mediante `var(--token)` para colores, fondos, bordes, espaciado y tipografía.
- No introduzcas hex, RGB/HSL ni colores nominales directamente en selectores locales.
- Si falta un token necesario, agrégalo en la fuente global de tokens del subproyecto con valores equivalentes para light y dark, siempre que esté dentro del alcance. Si no lo está, explica la dependencia en lugar de ocultar un valor fijo.
- Verifica contraste, estados hover/focus/disabled y legibilidad en light y dark.

## UX y accesibilidad mínimas

- Usa HTML semántico y controles nativos cuando correspondan.
- Mantén navegación por teclado, foco visible y nombres accesibles en controles con iconos.
- No dependas solo del color o del hover para comunicar estado.
- Muestra feedback para carga, éxito, vacío y error cuando el flujo pueda producir esos estados.
- Evita cambios visuales que alteren lógica o datos únicamente para mejorar apariencia.
