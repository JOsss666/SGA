# Modelo geográfico de SGA

## Alcance inicial

El catálogo inicial cubre Colombia hasta municipio/distrito:

- `Fiscal.countries`: país (`CO`, Colombia).
- `Fiscal.jurisdictions`: departamentos y municipios/distritos, relacionados por `parent_id`.
- `Fiscal.localities`: ciudades, cabeceras municipales, corregimientos y centros poblados contenidos en un municipio.

La migración `0007` contiene 33 divisiones de primer nivel (32 departamentos y
Bogotá D.C.) y 1.122 municipios/distritos, con código DANE y código externo de
Factus. La migración `0017` crea una localidad de tipo `municipal_seat` para
cada municipio/distrito.

## Por qué ciudad y municipio son conceptos separados

El municipio es una división político-administrativa y pertenece a un
departamento. Una ciudad o localidad es un asentamiento contenido en un
municipio. Aunque normalmente la cabecera municipal tiene el mismo nombre, no
son conceptos intercambiables.

Esta separación permite agregar después corregimientos y centros poblados sin
alterar la relación fiscal del tercero.

## Uso en terceros

`Fiscal.third_party_company_relations` conserva:

- `jurisdiction_id`: municipio o distrito del domicilio fiscal.
- `locality_id`: ciudad/localidad postal dentro de ese municipio.

Durante la transición se mantienen los campos legacy:

- `Ecosystem.thirdparties.country`: nombre del país.
- `Ecosystem.thirdparties.city`: nombre de la localidad.
- `Ecosystem.thirdPartyTaxInfo.municipality_id`: código externo de Factus.

La creación desde Facturación envía simultáneamente las claves normalizadas y
los valores legacy. Esto mantiene compatibles la facturación electrónica y los
módulos que todavía leen texto libre.

## API

Los selectores dependientes usan:

```text
GET /geography/countries
GET /geography/departments?country_id={id}
GET /geography/municipalities?country_id={id}&department_id={id}
GET /geography/localities?municipality_id={id}
```

No se consulta Factus para poblar el formulario. Factus permanece como código
de integración almacenado en `jurisdictions.external_code`.

## Extensión futura

Para agregar corregimientos o centros poblados se insertan filas en
`Fiscal.localities` con el `municipality_id` correspondiente y uno de los tipos
permitidos. No deben crearse como municipios ni sobrescribir la cabecera.
