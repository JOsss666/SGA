# Motor de retenciones — Colombia — Compras

## 1. Propósito

Este documento define la primera versión del árbol de decisión que SGA utilizará
para sugerir y calcular las retenciones aplicables a una compra realizada en
Colombia.

La lógica descrita aquí es una especificación funcional. No reemplaza la
validación tributaria o jurídica y debe poder actualizarse cuando cambien las
normas, las tarifas, las bases mínimas o la parametrización de una empresa.

## 2. Alcance inicial

El motor evaluará, en este orden:

1. Retención en la fuente a título de renta.
2. Retención de IVA.
3. Retención de ICA u otros impuestos territoriales.
4. Retención del impuesto de timbre.
5. Retención del impuesto al consumo.

Cada familia se evalúa de manera independiente. Que una familia no aplique no
debe impedir evaluar las siguientes.

## 3. Actores y conceptos

- **Comprador o empresa:** compañía propietaria del documento de compra.
- **Proveedor o tercero:** tercero al cual la empresa le está comprando.
- **Retención candidata:** retención configurada para un concepto, producto,
  servicio o categoría tributaria.
- **Base acumulada:** valor sobre el cual se evalúa la base mínima y se calcula
  la retención.
- **Exclusión forzada:** condición manual que impide aplicar una familia de
  retenciones, aunque las demás condiciones se cumplan.
- **Municipio de la transacción:** jurisdicción seleccionada o confirmada por el
  usuario para evaluar impuestos territoriales.

## 4. Entradas requeridas

### 4.1 Información de la compra

Como mínimo:

```js
{
  company_id,
  companyNit,
  supplierId,
  supplierNit,
  countryCode: "CO",
  municipalityCode,
  items: [
    {
      id,
      conceptId,
      categoryId,
      quantity,
      unitValue,
      subtotal,
      taxes: []
    }
  ]
}
```

### 4.2 Perfil fiscal de la empresa

Corresponde a la parametrización tributaria de la compañía compradora. La
estructura inicial se encuentra en
`GeneralDocmentation/configObjects/taxCompanyInfo.js`.

### 4.3 Perfil fiscal del proveedor

Debe exponer las mismas responsabilidades relevantes de renta, IVA, timbre,
consumo e impuestos territoriales. El motor no debe inferir una responsabilidad
que no esté parametrizada.

### 4.4 Lista de retenciones candidatas

Cada retención candidata debe normalizarse al menos así:

```js
{
  id,
  name,
  family,          // rent | iva | territorial | ring | consumption
  taxCode,
  conceptId,
  categoryId,
  municipalityCode,
  minimumBase,
  minimumBaseUnit, // COP | UVT u otra unidad parametrizada
  rate,
  rateUnit         // percent | per_thousand
}
```

## 5. Salida esperada

El motor debe devolver tanto las retenciones aplicadas como la trazabilidad de
las decisiones:

```js
{
  status: "OK",
  countryCode: "CO",
  operationType: "purchase",
  appliedWithholdings: [
    {
      id,
      name,
      family,
      base,
      rate,
      rateUnit,
      total,
      municipalityCode
    }
  ],
  decisions: [
    {
      family,
      applied,
      reasonCode,
      message
    }
  ],
  totals: {
    rent: 0,
    iva: 0,
    territorial: 0,
    ring: 0,
    consumption: 0,
    totalWithheld: 0
  },
  requiresUserReview: false,
  warnings: []
}
```

La trazabilidad es obligatoria: el sistema debe poder explicar por qué aplicó o
descartó cada retención.

## 6. Reglas generales

### 6.1 Validaciones previas

Antes de calcular:

1. Verificar que el documento pertenece al `company_id` autenticado.
2. Verificar que el NIT del comprador coincide con el NIT de la compañía
   propietaria.
3. Verificar que el país de la operación es Colombia.
4. Verificar que existen perfiles fiscales vigentes para comprador y proveedor.
5. Verificar que las retenciones candidatas tienen tarifa y base válidas.
6. Para ICA, exigir un municipio de la transacción válido.

Si falla la propiedad o identidad de la compañía, el cálculo se rechaza. Si
falta información fiscal o territorial, no se debe inventar un resultado: se
marca `requiresUserReview` y se informa el dato faltante.

### 6.2 Cálculo monetario

- Todos los cálculos internos deben usar precisión decimal, no aritmética
  binaria directa de JavaScript.
- La base y el total deben expresarse en COP antes de comparar bases mínimas.
- Una base expresada en UVT debe convertirse usando el valor vigente para la
  fecha fiscal del documento.
- Tarifa porcentual: `total = base * rate / 100`.
- Tarifa por mil: `total = base * rate / 1000`.
- La política de redondeo debe parametrizarse y aplicarse una sola vez al final
  del cálculo de cada retención.

### 6.3 Exclusión y base mínima

Para cada familia:

1. Si `forceException` es `true`, no se aplica la familia.
2. Si `acceptMinimumBase` es `true`, la base acumulada debe ser mayor o igual a
   `minimumBase`.
3. Si `acceptMinimumBase` es `false`, la retención puede calcularse sin validar
   el umbral mínimo.

> Los nombres actuales contienen `forceExeption` y `aceptMinimumBase`. Se
> documentan nombres normalizados (`forceException` y `acceptMinimumBase`) para
> una futura migración, pero la primera implementación deberá soportar los
> nombres actuales mientras se actualizan los datos.

## 7. Árbol de decisión

### 7.1 Retención a título de renta

1. Verificar que el comprador es agente retenedor de renta:
   `company.rent.rentWithholdingAgent === true`.
2. Si la empresa tiene exclusión forzada para renta, detener solamente esta
   familia.
3. Si el proveedor pertenece al régimen simple, no aplicar retención de renta.
4. Si el proveedor es autorretenedor de renta, no aplicarle esta retención.
5. Para cada retención de renta candidata:
   1. Determinar los ítems o conceptos que forman su base.
   2. Sumar la base aplicable.
   3. Validar la base mínima cuando corresponda.
   4. Calcular y agregar la retención.

Resultado de exclusión recomendado:

```text
RENT_NOT_WITHHOLDING_AGENT
RENT_FORCED_EXCEPTION
SUPPLIER_SIMPLE_REGIME
SUPPLIER_RENT_SELF_WITHHOLDER
RENT_MINIMUM_BASE_NOT_REACHED
```

### 7.2 Retención de IVA

1. Verificar que el comprador está habilitado para practicar retención de IVA:
   `company.iva.ivaWithholdingAgent === true` o la regla especial aplicable a
   comercializadoras internacionales.
2. Si existe una exclusión forzada de IVA, detener solamente esta familia.
3. Verificar que la compra contiene al menos un impuesto de IVA asociado a los
   ítems, conceptos o categorías.
4. Calcular la base de IVA sumando únicamente los valores gravados que
   correspondan a la retención candidata.
5. Comparar la calidad tributaria del comprador y del proveedor.
6. Validar la base mínima de cada retención candidata.
7. Calcular y agregar las retenciones de IVA que superen todas las validaciones.

#### Jerarquía inicial de IVA

| Peso | Calidad fiscal | Campo actual |
|---:|---|---|
| 3 | Entidad estatal | `iva.stateEntity` |
| 2 | Gran contribuyente DIAN | `iva.DIANMajorTaxpayer` |
| 1 | Responsable de IVA | `iva.ivaTaxResponsable` |

Regla inicial propuesta:

- Una entidad con mayor peso puede retener a otra de menor peso.
- Cuando la retención se origine exclusivamente por la calidad de responsable
  de IVA, se aplica únicamente frente a proveedores del nivel definido por esa
  regla especial.
- Las reglas de comercializadoras internacionales deben evaluarse por separado
  mediante `ivaWithholdingAgentByCI`.

La matriz exacta comprador/proveedor debe aprobarse antes de implementar esta
parte; un único número no representa necesariamente todas las excepciones
legales posibles.

### 7.3 Retención territorial — ICA

1. Solicitar o confirmar el municipio donde ocurre la transacción.
2. Buscar el impuesto territorial y la región mediante sus códigos, no mediante
   posiciones de arreglo.
3. Si la empresa tiene una exclusión forzada para ese municipio, no aplicar ICA.
4. Verificar que el comprador es agente retenedor de ICA en el municipio:
   `isTaxRetainer === true`.
5. Verificar que el proveedor no es autorretenedor de ICA en el municipio:
   `isSelfTaxRetainer !== true`.
6. Comparar la calidad tributaria territorial del comprador y del proveedor.
7. Identificar la actividad económica aplicable.
8. Obtener de la actividad la tarifa y la base mínima, salvo que exista una
   retención candidata más específica.
9. Validar la base mínima y calcular la retención.

#### Jerarquía territorial inicial

| Peso | Calidad fiscal territorial | Campo normalizado |
|---:|---|---|
| 3 | Gran contribuyente ICA | `grandTaxpayer` |
| 2 | Régimen común | `commonRegime` |
| 1 | Régimen especial | `specialRegime` |

Regla inicial: aplicar la retención cuando la calidad del comprador lo habilite
frente a la calidad del proveedor. Esta matriz debe configurarse por municipio,
pues las reglas territoriales pueden variar entre jurisdicciones.

Si el municipio o la actividad no pueden determinarse, el motor debe solicitar
revisión del usuario y no calcular ICA automáticamente.

### 7.4 Retención de timbre

1. Verificar que el comprador está habilitado como agente retenedor de timbre:
   `company.ring.ringWithholdingAgent === true`.
2. Si existe exclusión forzada, detener solamente esta familia.
3. Si el proveedor es autorretenedor de timbre, no aplicar la retención.
4. Para cada retención candidata, calcular la base aplicable.
5. Validar la base mínima cuando corresponda.
6. Calcular y agregar la retención.

### 7.5 Retención de impuesto al consumo

1. Verificar que el comprador está habilitado como agente retenedor de consumo:
   `company.consumption.consumptionWithholdingAgent === true`.
2. Si existe exclusión forzada, detener solamente esta familia.
3. Si el proveedor es autorretenedor de consumo, no aplicar la retención.
4. Verificar que existen ítems gravados con impuesto al consumo.
5. Para cada retención candidata, calcular su base.
6. Validar la base mínima cuando corresponda.
7. Calcular y agregar la retención.

## 8. Orden general del algoritmo

```text
validar propiedad, país y datos obligatorios
normalizar perfiles fiscales y retenciones candidatas

resultado.renta       = evaluarRenta(...)
resultado.iva         = evaluarIva(...)
resultado.territorial = evaluarIca(...)
resultado.timbre      = evaluarTimbre(...)
resultado.consumo     = evaluarConsumo(...)

consolidar retenciones sin duplicados
calcular totales por familia y total general
adjuntar decisiones, advertencias y revisiones requeridas
devolver resultado
```

Las funciones de familia deben ser puras: reciben datos normalizados, no
consultan la interfaz y no escriben directamente en la base de datos.

## 9. Reglas de consolidación

- La misma retención no puede agregarse dos veces sobre el mismo conjunto de
  ítems y jurisdicción.
- Dos retenciones de familias diferentes sí pueden coexistir.
- Una retención territorial debe conservar siempre el código del municipio.
- El total retenido es la suma de los valores finales redondeados.
- El motor debe conservar la base utilizada por cada resultado para auditoría.
- Una retención sugerida por el motor debe poder ser revisada por el usuario
  antes de contabilizar el documento.

## 10. Compatibilidad con la configuración actual

| Nombre actual | Nombre recomendado | Observación |
|---|---|---|
| `forceExeption` | `forceException` | Corrección ortográfica. |
| `aceptMinimumBase` | `acceptMinimumBase` | Corrección ortográfica. |
| `ring` | `stampTax` | `ring` se conserva inicialmente por compatibilidad. |
| `DIANMajorTaxpayer` | `dianMajorTaxpayer` | Usar camelCase uniforme. |
| `grandTaxPayer` | `grandTaxpayer` | Unificar capitalización. |
| `comonRegime` | `commonRegime` | Corrección ortográfica. |

No se recomienda cambiar estos campos directamente sin una migración de datos y
una capa temporal de compatibilidad.

## 11. Decisiones pendientes antes de programar

1. Confirmar si para habilitar renta se usa `rentTaxResponsable`,
   `rentWithholdingAgent` o ambos. Esta especificación propone
   `rentWithholdingAgent` por representar directamente la capacidad de retener.
2. Definir la matriz exacta de calidades para retención de IVA.
3. Definir la matriz territorial por municipio y el tratamiento de regímenes ICA.
4. Precisar si `forceException` pertenece al comprador, al proveedor, a la
   relación entre ambos o a una retención específica.
5. Definir cómo se seleccionan los ítems que integran la base de cada retención.
6. Definir la fuente y vigencia del valor de la UVT.
7. Definir política de redondeo y número de decimales.
8. Confirmar si las bases mínimas se acumulan por documento, concepto, proveedor
   o periodo fiscal.
9. Definir precedencia entre tarifa configurada en actividad ICA y tarifa de una
   retención candidata.
10. Confirmar qué usuario puede aceptar, retirar o modificar una retención
    sugerida automáticamente.

## 12. Casos mínimos de prueba

1. Comprador que no es agente retenedor de renta.
2. Proveedor perteneciente al régimen simple.
3. Proveedor autorretenedor de renta.
4. Compra cuya base está exactamente en el mínimo.
5. Compra cuya base está un peso por debajo del mínimo.
6. Compra con varias líneas que juntas superan la base mínima.
7. Compra con IVA y comprador de mayor calidad fiscal que el proveedor.
8. Compra sin IVA asociado.
9. Compra con municipio ICA válido y actividad configurada.
10. Compra sin municipio o con municipio no parametrizado.
11. Proveedor autorretenedor de ICA en el municipio seleccionado.
12. Exclusión forzada en cada familia.
13. Tarifa porcentual y tarifa por mil.
14. Base mínima expresada en UVT.
15. Varias retenciones aplicables sin duplicar una misma retención.

## 13. Evolución prevista

Después de validar compras en Colombia, la misma arquitectura debe extenderse a:

- Retenciones en ventas en Colombia.
- Otros tipos de documento.
- Nuevas jurisdicciones y países.
- Reglas versionadas por fecha de vigencia.
- Catálogos normativos de bases, tarifas y excepciones.
- Registro auditable de la versión de reglas utilizada en cada documento.

