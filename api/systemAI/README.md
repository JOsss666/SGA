# systemAI

Infraestructura central de inteligencia artificial de SGA.

Esta carpeta concentra la definicion, ejecucion, seguridad, memoria y
observabilidad de los agentes. El resto de la API debe interactuar con este
sistema a traves de su capa publica en `api/`, sin depender directamente de un
SDK de OpenRouter, OpenAI u otro proveedor.

## Estructura

```text
systemAI/
├── api/                    # Entrada HTTP del modulo
│   ├── controllers/        # Adaptacion de solicitudes y respuestas
│   ├── routes/             # Endpoints de agentes, sesiones y ejecuciones
│   └── schemas/            # Validacion de payloads HTTP
├── agents/
│   ├── definitions/        # Configuracion declarativa de cada agente
│   └── orchestration/      # Ciclos, delegacion y seleccion de agentes
├── config/                 # Configuracion y variables de entorno del modulo
├── core/
│   ├── contracts/          # Interfaces independientes del proveedor
│   └── errors/             # Errores propios del dominio de IA
├── evaluations/
│   ├── datasets/           # Casos de prueba y ejemplos esperados
│   └── graders/            # Evaluadores de calidad, costo y seguridad
├── knowledge/
│   ├── loaders/            # Ingestion y normalizacion de conocimiento
│   └── retrieval/          # Recuperacion de contexto relevante
├── memory/
│   ├── repositories/       # Acceso a conversaciones y memorias persistentes
│   └── strategies/         # Resumen, recorte y memoria de largo plazo
├── middleware/             # Rate limiting y manejo de errores HTTP
├── observability/
│   ├── logging/            # Registro estructurado de ejecuciones
│   ├── metrics/            # Tokens, latencia, errores y costos
│   └── tracing/            # Trazas de pasos y llamadas a herramientas
├── persistence/
│   ├── migrations/         # Cambios aditivos de esquema para IA
│   └── repositories/       # Persistencia de agentes, skills y ejecuciones
├── providers/
│   ├── openai/             # Adaptador para API directa de OpenAI
│   └── openrouter/         # Adaptador para OpenRouter
├── security/
│   ├── guardrails/         # Validacion de entradas y salidas
│   └── permissions/        # Autorizacion de agentes y herramientas
├── skills/
│   ├── definitions/        # Skills versionadas y sus metadatos
│   └── loaders/            # Descubrimiento y carga de skills
├── tools/
│   ├── definitions/        # Contratos y catalogo de herramientas
│   └── executors/          # Ejecucion controlada de herramientas
└── tests/
    ├── fixtures/           # Datos estables para pruebas
    ├── integration/        # Flujos completos con dependencias controladas
    └── unit/               # Pruebas aisladas
```

## Reglas de dependencia

1. `core` no depende de SDKs externos ni de Express.
2. `providers` implementa los contratos de `core`.
3. `agents`, `skills`, `memory` y `tools` trabajan contra contratos, no contra
   un proveedor concreto.
4. `api` solo adapta HTTP al dominio y no contiene logica del agente.
5. La identidad proviene de una cookie HttpOnly y toda herramienta valida
   permisos y el alcance de `company_id` antes de leer
   o modificar datos.
6. Las operaciones sensibles o de escritura deben admitir aprobacion humana y
   dejar una traza auditable.

## Orden sugerido de implementacion

1. Contratos del proveedor y del ejecutor de agentes.
2. Adaptador de OpenRouter y configuracion segura.
3. Registro declarativo de agentes, skills y tools.
4. Sesiones y memoria persistidas en PostgreSQL.
5. Endpoint de ejecucion con streaming, limites y auditoria.
6. Evaluaciones y adaptador opcional de OpenAI directo.
