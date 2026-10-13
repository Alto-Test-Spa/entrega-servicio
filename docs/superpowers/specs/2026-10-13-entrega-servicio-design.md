# Informe de Entrega de Servicio — diseño

**Fecha:** 2026-10-13 · **Autor del pedido:** Matías Quiroz · **Estado:** borrador para revisión
**Maqueta aprobada en lo visual (v2):** https://claude.ai/artifact/G7KfCvHLTsqkr5DqBWCuci

## 1. Objetivo

Una sola plantilla de **entrega de servicio** que sirva para cualquier trabajo de Alto Test
(instalación de anclajes, limpieza de vidrios, reposición de sellos, y los que vengan).
El tipo de servicio se elige al inicio y precarga secciones, normativa, textos base y campos
propios. **Agregar un servicio es agregar una definición (datos), no código nuevo.**

Éxito significa:
- Un técnico elige servicio y modalidad, completa los datos una vez y obtiene un PDF vertical
  Carta con índice y numeración correctos.
- No se puede **emitir** con campos vacíos ni texto de plantilla sin reemplazar.
- Un hallazgo fuera de alcance queda registrado de forma estructurada, con su marca de
  oportunidad comercial.
- Un servicio nuevo se agrega escribiendo un archivo de definición, sin tocar los renderizadores.

## 2. Decisiones ya tomadas (no reabrir sin pedirlo)

| # | Decisión | Origen |
|---|---|---|
| D1 | Servicios iniciales: **anclajes, limpieza de vidrios, reposición de sellos**. | Respuesta de Matías |
| D2 | Oportunidades comerciales **solo informadas dentro del documento**. Sin automatización, sin envío a propuestas. El dato queda estructurado para poder exportar después. | Respuesta de Matías |
| D3 | Salida: **PDF por impresión del navegador**, Carta **vertical**, folio como nombre de archivo (igual que las otras apps). | Respuesta + feedback |
| D4 | La normativa depende de la **modalidad de acceso**: a nivel de piso / altura con carro colgante / altura con cuerdas (rappel). La normativa de seguridad en altura se reutiliza entre servicios. | Respuesta de Matías |
| D5 | Campos del hallazgo: ubicación, descripción, fotos, severidad, riesgo inmediato (sí/no), recomendación, oportunidad comercial (sí/no). | Respuesta de Matías |
| D6 | **Vigencias son texto**. Una vigencia vencida **avisa, nunca bloquea** la redacción ni la generación. | Respuesta de Matías |
| D7 | **Máximo 6 fotos en total** en el registro fotográfico del servicio ejecutado y **máximo 6 en total** en la sección de hallazgos. | Feedback de Matías |
| D8 | Se elimina el registro de firmas y el control de revisiones. La sección final se llama **Emisión** y muestra **una sola persona** (Camilo Jara, con su cargo), sin línea de firma. | Feedback de Matías |
| D9 | "Hallazgos fuera de alcance" es la **última sección del cuerpo**, antes de Emisión. | Plan aprobado |
| D10 | Proyecto **nuevo y separado**, con el Worker compartido existente. | Plan aprobado |

## 3. Fuera de alcance (v1)

- Envío automático de oportunidades a `propuesta_economica_react` o por correo (ver D2).
- Historial de revisiones y reemisiones (Rev. 1, 2…). v1 emite siempre **Rev. 0**.
- Firma manuscrita o digital.
- Bloqueo por vigencias vencidas (ver D6).
- Librería de componentes compartida entre apps (se copia, como hace hoy la familia; queda como deuda).
- Unión automática de PDF de anexos al informe.

## 4. Arquitectura

**Proyecto:** `informes/entrega_servicio_react` (repo git propio, a crear al implementar).
**Stack:** Vite + React 19 + TypeScript + Tailwind v4, `reicon-react`, `oxlint`, IBM Plex Sans/Mono.
**Convención de la familia:** identificadores en inglés, comentarios en español, contenido del
documento en español. Puerto de desarrollo fijo **5213** (5210, 5211 y 5212 están tomados).
**Backend:** Worker compartido `altotest-documentos`, **`kind = "entrega"`**. No se modifica el Worker.
**Datos:** la nube es la fuente de verdad, con mirror local de resiliencia y autoguardado con
debounce de 3 s, guard de no-op y flush al ocultar. No guarda hasta la primera edición real.
**Folio:** `EN-aaaammdd-hhmmss`.
**Acceso:** portón de clave compartida, idéntico a los hermanos.

```
src/
  App.tsx, EntregaEditor.tsx
  types.ts
  services/               una definición por servicio (aquí se agrega un servicio nuevo)
    index.ts               registro { anchors, glass, seals }
    anchors.ts, glass.ts, seals.ts
    common.ts              secciones comunes
    normative.ts           bloques de normativa por modalidad
  lib/
    sections.ts            resolución de secciones activas y numeración (única fuente de números)
    interpolate.ts         {{variable}} → dato único
    validate.ts            validación pura
    links.ts               trazabilidad: lee levantamiento/cotización y adapta a datos comunes
    store.ts, api.ts, code.ts, date.ts, image.ts   (copiados y adaptados de la familia)
  components/
    sections/              un renderizador por tipo de sección (ver 6)
    Cover, TableOfContents, PrintStyles (@page y pie), Toolbar, IssuesPanel, DataPanel, ...
```

## 5. Modelo de datos

```ts
type AccessMode = 'ground' | 'suspended_platform' | 'rope'   // piso / carro colgante / cuerdas
type Severity = 'critical' | 'needs_action' | 'observation' | 'compliant'

interface SharedData {            // datos únicos: se ingresan una vez
  client: string; asset: string; address: string
  executionDate: string           // dd/mm/aaaa
  quoteCode: string               // COT-… (enlace)
  surveyCode: string              // IL-… (enlace)
  issuerName: string; issuerRole: string    // la persona única de Emisión
}

interface Finding {
  id: string; location: string; description: string
  photos: PhotoItem[]             // el total de la sección ≤ 6
  severity: Severity; immediateRisk: boolean
  recommendation: string; commercialOpportunity: boolean
}

interface EntregaState {
  code: string
  serviceId: string               // clave en el registro de servicios
  accessMode: AccessMode
  shared: SharedData
  hiddenSections: string[]        // ids; las fijas nunca entran acá
  values: Record<string, string>  // edición de celdas y textos, por clave de sección
  coverPhoto?: string             // foto del edificio (JPEG comprimido, opcional)
  coverVeil: number               // 0–100, oscurecimiento sobre la foto (por defecto 60)
  photos: PhotoItem[]             // registro del servicio ejecutado, ≤ 6
  findings: Finding[]
  layoutImage?: string            // solo servicios con sección 'layout'
  status: 'draft' | 'issued'
}
```

El estado se guarda tal cual como `doc` opaco en el sobre del Worker (`{ code, client, date, doc }`).

## 6. Definiciones de servicio y tipos de sección

```ts
interface ServiceDefinition {
  id: string; label: string; codePrefix: string      // p. ej. 'AT-R-ANC'
  defaultAccessMode: AccessMode
  title: string; intro: string                        // admiten {{variables}}
  normative: NormativeItem[]                          // base del servicio
  sections: SectionDef[]                              // en orden de documento
  maintenancePlan: TableData; scopeTable: TableData
}
type SectionDef =
  | { id: string; title: string; kind: 'table'; group: 'common' | 'service'; data: TableData }
  | { kind: 'facts'; ... }       // ficha clave-valor + texto de conclusión
  | { kind: 'layout'; ... }      // plano o croquis con leyenda
  | { kind: 'annexes'; ... }     // lista de anexos con vigencia como texto
  | { kind: 'photos' | 'findings' | 'normative' | 'identification' | 'issuance'; ... }
```

Tipos de sección de v1: `identification`, `normative`, `table`, `facts`, `layout`, `photos`,
`annexes`, `findings`, `issuance`. Cada uno tiene **un** renderizador genérico. Los tres servicios
iniciales se arman solo con estos tipos. Si un servicio futuro necesita un tipo nuevo, se agrega
el tipo (una vez) y no un componente por servicio.

**Secciones comunes** (todos los servicios): identificación, normativa de referencia, alcance
ejecutado, registro fotográfico, plan de mantención, anexos, hallazgos fuera de alcance, emisión.
**Secciones propias**: p. ej. anclajes → *Resultados de ensayos* y *Layout de puntos / As-built*;
vidrios → *Sectores intervenidos* y *Equipos y productos*; sellos → *Sellos repuestos* y
*Pruebas de estanqueidad*.
**Fijas (no ocultables):** identificación y emisión. El resto se oculta sin borrar datos.

**Modalidad de acceso.** Elige qué bloque de normativa se suma y qué valor toma el campo
"Equipo de acceso". `ground` no suma bloque. `suspended_platform` y `rope` suman un bloque propio.

## 7. Numeración e índice

`lib/sections.ts` es el **único** lugar que calcula números: filtra las secciones ocultas,
numera en orden y devuelve `{ section, number }[]`. El índice y los encabezados leen de ahí. Nunca se escribe un número a mano en JSX.

## 8. Datos únicos

Los textos de las definiciones usan `{{client}}`, `{{asset}}`, `{{executionDate}}`,
`{{issuerName}}`, etc. `interpolate()` los resuelve al renderizar. Un dato se edita en **un**
panel y se propaga a portada, identificación, textos y emisión. Un dato único vacío es un
bloqueo de emisión.

## 9. Trazabilidad

El usuario ingresa el código de levantamiento (`IL-…`) y/o de cotización (`COT-…`). `lib/links.ts`
pide el documento al Worker (`GET /reports/informe/:code`, `GET /reports/economica/:code`) y lo
adapta a `SharedData`. Los modelos conocidos son:

- Cotización: `clientName, assetName, rut, address, email, phone`.
- Informe de levantamiento: `clientName, clientAsset, clientContact`.

Los adaptadores son tolerantes: un campo que no exista se deja vacío y el usuario lo completa.
Todo es editable después, y el valor final vive **solo** en la entrega. Si el código no existe o
falla la red, se muestra un aviso y se sigue a mano. Los códigos son opcionales.

## 10. Hallazgos fuera de alcance

Lista de `Finding` (ver 5). Reglas: máximo **6 fotos en total** en la sección, repartidas como
quiera el usuario; cada botón "agregar foto" se desactiva al llegar al tope. La sección muestra
un resumen (cantidad, con riesgo inmediato, oportunidades comerciales).
**Las fotos de un hallazgo son del mismo tamaño que las del registro fotográfico** (rejilla de 3
columnas, proporción 4:3), no miniaturas: el informe debe ser técnico y también vendible, y la foto
es la evidencia. Cada foto lleva descripción obligatoria. Cada hallazgo se arma como texto primero
(severidad, ubicación, descripción, recomendación) y fotos grandes debajo. **Las oportunidades no
salen del documento** (D2); el campo estructurado permite exportarlas más adelante sin migrar datos.

## 11. Registro fotográfico

Máximo **6 fotos en total** (D7). Cada foto lleva descripción obligatoria. Se comprimen en el
navegador antes de guardarse (máx. 1600 px de lado mayor, JPEG 0,78), igual que en
`informe_levantamiento`. Con 12 fotos como tope absoluto el documento queda muy por debajo del
límite de 25 MB por valor de KV.

## 12. Validación antes de emitir

`validate(state, definition): Issue[]` es una función **pura** y probada con tests unitarios.

| Nivel | Regla |
|---|---|
| **Bloquea** | Dato único vacío. |
| **Bloquea** | Campo obligatorio vacío en una sección visible. |
| **Bloquea** | Texto de plantilla sin reemplazar: corchetes `[…]`, la palabra "Incorporar", `{{…}}` sin resolver. |
| **Bloquea** | Sección `layout` visible sin imagen cargada. |
| **Avisa** | Vigencia (texto con fecha legible) anterior a la fecha de ejecución. |
| **Avisa** | Normativa marcada "por validar". |

Un informe con bloqueos es un **borrador**: se puede seguir redactando e imprimir (con marca
"BORRADOR" en portada), pero no emitir. **Emitir** exige cero bloqueos, fija `status = 'issued'` y
marca la portada como emitida. Editar un informe emitido lo devuelve a borrador (ver 16).
Ocultar una sección saca sus bloqueos de la cuenta.

## 13. Impresión y paginación

**Decisión: paginación nativa del navegador, sin medir en JS.** El informe de levantamiento mide
cada capítulo en pantalla y reserva hojas con `min-height`. Esa medición nunca coincidió con la
impresión real y produjo la mayor parte de sus bugs (pie flotando, hojas en blanco, hojas custom).
Aquí no se mide nada: el navegador reparte el contenido en hojas al imprimir, así que no hay
diferencia entre lo medido y lo impreso.

**Reglas de CSS** (todas fuera de `@layer`, como exige la familia):

| Necesidad | Mecanismo |
|---|---|
| Hoja Carta vertical con margen físico | `@page { size: Letter; margin: 0.8in 0.75in 0.9in 0.75in }` |
| Portada a sangre, sin pie | `@page cover { margin: 0 }` + `page: cover` en la portada, con alto exacto de 11 in |
| Cada sección en hoja nueva | `break-before: page`. Una sección larga continúa en la hoja siguiente |
| Pie en cada hoja | cajas de margen: `@bottom-left` = "ALTO TEST · folio", `@bottom-right` = "Página n de N" (`counter(page)`, `counter(pages)`). Línea fina acero |
| Filas y fotos no se parten | `break-inside: avoid` en `tr` y `figure` |
| Hallazgos con fotos grandes | el bloque de texto del hallazgo no se parte y queda unido a su primera foto (`break-after: avoid`). La tarjeta completa **sí puede continuar** en la hoja siguiente entre dos fotos, porque con fotos grandes ya no cabe siempre en una hoja |
| Tablas largas | `thead { display: table-header-group }`: el encabezado se repite en cada hoja |
| Títulos no quedan huérfanos | `break-after: avoid` en los títulos de sección |
| Nada encoge el PDF | `overflow-wrap: anywhere` global, `table-layout: fixed`, imágenes con `max-width/max-height` |
| Plano (layout) e imágenes altas | `max-height: 7in` en impresión |

**El pie es distinto al del informe de levantamiento** (pedido de Matías): línea fina y texto,
sin franja acero ni bloque diagonal. El pie va en las cajas de margen del `@page`, no en un
elemento de la página. El folio se inyecta con un `<style>` generado en tiempo de ejecución
(se sanea: solo caracteres del formato `EN-aaaammdd-hhmmss`). El nombre de la sección no puede ir
en el pie (Chrome no soporta `string-set`), y el índice no muestra números de hoja. Es un
compromiso aceptado. Mantiene los **números de sección** del índice.

**Lo que desaparece** respecto del informe de levantamiento: `useLayoutEffect` de medición,
`min-height` calculado, hojas custom con `@page` nombrado, rótulo "continúa" y el pie
`position: absolute`. También deja de existir el problema de "la primera hoja de un capítulo
multihoja sin pie".

**Pantalla:** cada sección se ve como una hoja de ancho Carta con alto mínimo de una hoja que
crece con el contenido. No muestra cortes de hoja (no se pueden predecir sin medir). La verdad
visual es la vista previa de impresión del navegador. La barra incluye un botón "Imprimir / PDF".

**Requisito de navegador:** las cajas de margen necesitan Chrome o Edge reciente (Chromium).
Probado con Chromium 153. Se estima soportado desde Chrome 131 y no está verificado en
versiones anteriores. En Firefox o Safari el documento sale correcto, pero **sin pie**; la barra
avisa "Para el PDF usa Chrome o Edge".

**Prueba de viabilidad hecha (2026-10-13, Chromium 153, scratchpad):** documento de 11 hojas con
portada a sangre, tabla de 70 filas, 7 hallazgos, plano alto y una cadena larga. Resultado:
todas las hojas son 8,5 × 11 in, la tabla se repartió en 3 hojas con el encabezado repetido, ninguna
tarjeta se partió, el plano cupo en su hoja y el pie muestra "Página n de 11" salvo en la portada.
**Hallazgo clave:** una sola cadena sin espacios en un `<p>` sin protección ensanchó el documento
y Chrome **redujo toda la escala del PDF a ~50 %**. Con `overflow-wrap: anywhere` global el
problema desaparece. Es un invariante de la app.

**Por qué los límites de 6 fotos ayudan:** con 6 fotos por sección (rejilla de 2 columnas, 3 filas)
el bloque de fotos cabe en una hoja, así que el contenido es predecible.

**Compuertas automáticas de PDF** (se corren en CI y antes de cada entrega, ver 15):
1. Todas las hojas son 8,5 × 11 in y el ancho de contenido en impresión no supera el de la hoja
   (`scrollWidth ≤ 816 px` con la hoja emulada), que es lo que detecta el encogimiento.
2. Ninguna hoja queda en blanco (tinta mínima) y toda sección visible empieza en una hoja nueva.
3. Todo el texto del DOM aparece en el texto del PDF (nada recortado).
4. Cada hoja, salvo la portada, lleva el pie con "Página n de N" correcto.
5. Ninguna fila de tabla, foto ni bloque de texto de un hallazgo queda partido entre dos hojas, y
   ningún hallazgo queda con su texto en una hoja y todas sus fotos en la siguiente sin necesidad.

Título del documento: fijo durante la edición; durante `beforeprint` pasa a ser el folio
(nombre del PDF), como en las otras apps.

### Portada

- **Logo:** se copia el `Wordmark` del `informe_levantamiento` (texto "ALTO TEST" con la catenaria y
  los puntos de anclaje de placa y perno en los extremos), en tono naranjo sobre fondo oscuro, sin
  inventar una variante nueva.
- **Foto del edificio de fondo:** la sube quien arma el informe (control "Foto de portada"). Se
  reduce a un máximo de 1800 px de ancho y se guarda como JPEG 0,82, con el mismo `resizePhoto()` de
  `propuesta_tecnica_react`. Es opcional: sin foto la portada usa un fondo de marca.
- **Velo:** oscurecimiento ajustable (`veilBackground()` de `propuesta_tecnica_react`: capa pareja más
  un degradado corto, para que no se imprima en bandas) y un oscurecido adicional en el tercio
  inferior, de recorrido corto, para que el texto se lea sobre ventanas claras.
- **Composición:** logo arriba, título del servicio y activo en el tercio inferior, ficha de cliente,
  activo, ejecución y folio, y la franja de estado de hallazgos al pie.
- **Impresión:** `print-color-adjust: exact` para que fondo y foto salgan sin activar "Gráficos de
  fondo". La compuerta de PDF verifica que la portada sale a sangre y sin bandas visibles.
- **No cuenta** en el tope de 6 fotos de las secciones.

## 14. Contenido de cada servicio

- **Anclajes:** salido del Dossier de Ranco (`AT-R-ANC-001-INS00`). Normativa validada: EN 795:2012,
  EN 365:2004, NCh 1258, D.S. 594. Es la **prueba de referencia**: reproducir ese dossier con
  sus datos reales, sin los defectos que tiene (marcador sin reemplazar, texto de instrucción en el
  layout, cargo inconsistente, typo).
- **Limpieza de vidrios** y **Reposición de sellos:** el contenido de la maqueta es **borrador
  ilustrativo**. Alto Test debe validar secciones, textos base, campos y plan de mantención.
- **Normativa propuesta** (ver Anexo A): todo lo nuevo entra como **"por validar"** y avisa antes de
  emitir sin bloquear, hasta que Alto Test lo confirme. Es una propuesta basada en búsqueda
  en fuentes públicas, no asesoría legal.

## 15. Pruebas

- Unitarias (Vitest): `sections.ts` (ocultar renumera), `interpolate.ts`, `validate.ts` (cada
  regla de la tabla 12, incluida la que **no** bloquea una vigencia vencida), adaptadores de `links.ts`.
- Prueba de referencia: el estado de Ranco renderiza las secciones y números esperados.
- Playwright: portón, guardado y carga contra el Worker local, ocultar secciones, tope de 6 fotos
  en cada lado, bloqueo de "Emitir", PDF Carta vertical.
- **Compuertas de PDF** (sección 13): se generan PDF reales de varios casos límite y se analizan con
  `pypdf` y `pypdfium2` (páginas, tamaño, texto completo, hojas en blanco, filas partidas). Casos:
  sección corta, tabla de 70 filas, 6 fotos más 6 hallazgos con fotos, cadena larga sin espacios,
  plano alto, y los tres servicios con todas las secciones visibles y con la mayoría ocultas.
- Cada servicio nuevo debe pasar un test genérico: toda definición válida renderiza sin error.

## 16. Preguntas abiertas y riesgos

1. **Normativa y contenido de vidrios y sellos:** propuesta de normativa en el Anexo A, por
   validar. El contenido (secciones, textos, plan de mantención) sigue siendo borrador.
2. **Modalidad por defecto de cada servicio:** la maqueta usa piso (anclajes), carro colgante
   (vidrios) y cuerdas (sellos). Es una suposición a confirmar.
3. **Editar un informe emitido:** **decidido por Matías** (2026-10-13): vuelve a borrador y se
   reemite como Rev. 0. Numerar revisiones queda fuera de alcance.
4. **Paginación:** riesgo bajado al sustituir la medición en JS por paginación nativa (sección 13).
   Riesgo residual: requiere Chrome o Edge reciente para el pie. Se confirma el navegador de
   Camilo antes de entregar.
5. **Cuota de KV (1000 `put`/día compartidas):** el autoguardado ya mitiga el consumo. Esta app
   suma una cuarta fuente de escrituras. Se vigila; el plan pago es la salida.
6. **Forma real de los documentos enlazados:** los adaptadores se escriben leyendo los tipos
   reales de cada app al implementar, no de memoria.

## 17. Hitos de entrega (rondas chicas con feedback)

1. **Motor:** tipos, registro de servicios, secciones genéricas, numeración, datos únicos,
   validación, impresión vertical, servicio *Anclajes* y la prueba de Ranco.
2. **Servicios 2 y 3:** *Limpieza de vidrios* y *Reposición de sellos*, solo como definiciones.
3. **Trazabilidad, hallazgos y emisión:** enlaces a levantamiento y cotización, fotos con tope,
   borrador/emitido, despliegue.

## Anexo A. Normativa propuesta (por validar)

**Método:** búsqueda en fuentes públicas el 2026-10-13. No encontré una norma chilena específica
para carros colgantes ni para acceso por cuerdas, así que se propone el marco legal chileno
general y las normas técnicas internacionales como referencia. Alto Test debe confirmar cuáles
aplican, idealmente con su prevencionista o asesor legal.

| Bloque | Norma | Qué es | Respaldo en la búsqueda |
|---|---|---|---|
| **General (todos los servicios)** | Ley N°16.744 | Seguro social contra accidentes del trabajo y enfermedades profesionales | Citada en estándares de contratistas en Chile. |
| | D.S. N°44 | Reglamento de gestión preventiva de riesgos laborales. Reemplaza al D.S. 40 y al D.S. 54, vigente desde el 01.02.2025 | Varias fuentes (ACHS, ASIMET, Previsión Social). La fecha de publicación varía entre fuentes (2023 el decreto, 2024 el Diario Oficial). |
| | D.S. N°594 | Condiciones sanitarias y ambientales básicas en los lugares de trabajo | Ya la usa Alto Test en anclajes. No confirmé qué artículo aplica a altura. |
| **Trabajo en altura (carro o cuerdas)** | NCh 1258 | Serie de equipos de protección personal contra caídas (arnés, estrobos, etc.) | La usa Alto Test en anclajes. La numeración de sus partes difiere entre fuentes, así que **no se citan las partes**. |
| **Carro colgante** | EN 1808:2015 | Requisitos de seguridad de equipos de acceso suspendidos | Verificada (edición vigente). Excluye plataformas suspendidas con cuerdas de fibra. |
| **Acceso por cuerdas** | EN 12841 | Dispositivos de ajuste de cuerda para acceso por cuerdas | Verificada (versión 2024). |
| | ISO 22846-1:2003 y -2:2012 | Principios y código de práctica del acceso por cuerdas | Verificada. |
| | IRATA ICOP | Código internacional de práctica (asociación, no ley) | Verificado como documento de práctica. |
| **Limpieza de vidrios** | ANSI/IWCA I-14.1 | Seguridad en limpieza de ventanas (cuerdas, plataformas, escaleras) | Existe y se usa en normas de edificación de EE. UU. Su texto no se pudo leer. |
| **Reposición de sellos** | ASTM C920 / ISO 11600 | Selladores elastoméricos para juntas | C920 verificada; su texto dice que es similar a ISO 11600. |
| | EN 15651-2:2017 | Selladores de acristalamiento de uso no estructural | Verificada. **Excluye acristalamiento estructural.** |
| | ASTM C1193 | Guía para el uso de selladores de juntas | Verificada solo por su título. |
| | AAMA 501.2 | Prueba de riego en terreno de muros cortina y fachadas (boquilla a 30 psi) | Verificada. Es la referencia natural para "pruebas de estanqueidad". |
| | ASTM C1521 | Evaluación de adherencia de selladores instalados | **No verificada en la búsqueda**. Propuesta por conocimiento previo. |

**No se incluyen a propósito:** las normas chilenas de vidrio (NCh 135, 890, 132, 565, 2434),
porque las fuentes se contradicen en cuál aplica y son relevantes solo para recomendar
reemplazos, no para limpiar ni sellar. Tampoco se incluyó el D.S. 76 (subcontratación): fue citado en
un estándar privado y no pude confirmar su alcance actual.

**Detalle a decidir con Alto Test:** la maqueta ya no inventa la duración de la prueba de riego de
sellos. El campo queda como `[definir según el protocolo]` hasta que se fije con AAMA 501.2 u otro
procedimiento propio.
