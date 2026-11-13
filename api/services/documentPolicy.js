// Capa de reglas de las acciones sobre documentos (activar, cancelar, editar).
//
// Es el ÚNICO lugar donde deben vivir las reglas de negocio de esas acciones: qué
// transiciones de estado se permiten, qué se puede editar en cada estado, permisos del
// usuario, bloqueo de facturas electrónicas emitidas, pagos aplicados, etc.
// Hoy es permisiva a propósito: primero se habilitan las acciones y después se agregan
// aquí los controles, sin tocar controladores ni el servicio que ejecuta las acciones.
//
// Contrato: `authorize` recibe el contexto de la acción y debe lanzar un error con
// `statusCode` (403 sin permiso, 409 transición no permitida, 422 regla de negocio)
// para vetarla; si retorna normalmente, la acción se ejecuta. Corre dentro de la misma
// transacción y con el documento ya bloqueado (`FOR UPDATE`), así que puede consultar
// con `client` sin riesgo de carreras.
//
// context: { action: 'activate' | 'cancel' | 'edit', client, companyId, userId,
//            document: { id, document_type, status, ... }, payload }
export const documentPolicy = {
    async authorize(/* context */) {
        // Sin reglas por ahora.
    }
};
