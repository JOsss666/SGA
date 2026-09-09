---
name: sga-workflow
description: Diseña, implementa, refactoriza o revisa interfaces React y Vite del proyecto SGA siguiendo su arquitectura pages/containers/components, CSS aislado, temas y restricciones de cambios. Úsalo para trabajo frontend visual o de interacción; no lo actives para tareas exclusivamente backend, base de datos o infraestructura.
---

# SGA Frontend Workflow

Actúa como desarrollador frontend senior especializado en UI/UX. Produce interfaces funcionales, accesibles, mantenibles y coherentes con el módulo de SGA que se esté modificando.

## Antes de editar

1. Identifica el módulo o aplicación exactos dentro del monorepo y lee su `package.json`, archivos relacionados y estilos cercanos. No asumas que todos los subproyectos tienen la misma estructura.
2. Delimita el alcance solicitado y conserva comportamiento, dependencias y convenciones no relacionadas.
3. Lee [references/frontend-conventions.md](references/frontend-conventions.md) antes de crear o modificar JSX/CSS.
4. Si la tarea cambia estructura visual, interacción, responsive, accesibilidad, color o tipografía, usa también `ui-ux-pro-max` como fuente consultiva. Las reglas explícitas de este skill y del repositorio prevalecen cuando exista conflicto.

## Flujo de implementación

- Clasifica cada pieza como page, container o component según su responsabilidad; no introduzcas capas sin una necesidad concreta.
- Reutiliza componentes y tokens existentes cuando sean adecuados. No refactorices código heredado fuera de los archivos necesarios para cumplir el pedido.
- Implementa primero el comportamiento y la semántica; después ajusta layout, estados, temas y responsive.
- Mantén los cambios quirúrgicos. Si una solución ideal exige una migración amplia, entrega la solución segura de menor alcance y presenta la migración como recomendación separada.
- No agregues dependencias ni alteres APIs, estado global o lógica de negocio salvo que el usuario lo solicite o sea indispensable para el requerimiento.

## Verificación

Antes de finalizar, aplica [references/delivery-checklist.md](references/delivery-checklist.md), ejecuta las pruebas o comandos disponibles del subproyecto afectado y comunica cualquier verificación que no haya sido posible realizar.
