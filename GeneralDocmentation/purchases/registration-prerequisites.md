# Guía de ayuda: requisitos para registrar una compra

Esta guía aplica cuando un usuario consulta cómo registrar una compra en SGA.
Antes de crear el documento de compra, se deben validar las parametrizaciones
descritas a continuación. La guía no reemplaza las políticas contables o
tributarias de la compañía.

## Lista de verificación obligatoria

1. **Cuenta contable de la compra.** Debe existir y estar habilitada la cuenta
   contable que recibirá el valor de la compra.
2. **Concepto de compra.** Debe existir un concepto de compra que tenga
   asignadas la cuenta contable y su naturaleza contable: **débito** o
   **crédito**, según corresponda al registro definido por la compañía.
3. **Impuestos de la compra.** Deben estar parametrizados los impuestos que se
   aplicarán, incluido el **IVA descontable** cuando corresponda.
4. **Retenciones.** Deben existir las retenciones en la fuente que puedan
   asociarse a la compra. Su aplicación depende de las condiciones tributarias
   de la operación y de las partes involucradas.
5. **Producto de inventario.** Si la compra se controla por inventarios, debe
   crearse primero el producto y configurarse su comportamiento para compra y
   venta.
6. **Tercero o proveedor.** Debe crearse el tercero que vende el producto y
   asociarle el producto suministrado, los impuestos aplicables y las
   retenciones que correspondan.

## Orden recomendado de parametrización

1. Crear o confirmar la cuenta contable.
2. Crear o confirmar el concepto de compra con cuenta y naturaleza asignadas.
3. Parametrizar los impuestos y las retenciones aplicables.
4. Crear y configurar el producto cuando intervenga inventario.
5. Crear el tercero/proveedor y asociarle el producto, impuestos y retenciones.
6. Registrar la compra con los elementos previamente validados.

## Respuesta esperada de la IA

Al responder una pregunta sobre cómo registrar una compra, la IA debe mostrar
esta lista de verificación de forma clara y solicitar la parametrización que
falte. No debe asumir que una cuenta, concepto, impuesto, retención, producto o
tercero ya existe sin que el usuario lo confirme o el sistema lo valide.
