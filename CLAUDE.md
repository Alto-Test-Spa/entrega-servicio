# CLAUDE.md — Informe de Entrega de Servicio (Alto Test)

## Qué es
Plantilla única de informe de entrega de servicio. El tipo de servicio (anclajes, limpieza de vidrios, reposición de sellos) es una **definición de datos** (`src/services/`), no código nuevo. Spec: `docs/superpowers/specs/2026-10-13-entrega-servicio-design.md`. Plan: `docs/superpowers/plans/2026-10-13-entrega-servicio.md`.

## Stack y comandos
Vite 8 + React 19 + TS + Tailwind v4, `reicon-react`, Worker compartido `altotest-documentos` (`kind=entrega`; el Worker acepta cualquier `kind`, no se modificó; su código está en `/altotest-documentos`). Puerto de dev **5213**.
`npm run dev | build | lint | test` (Vitest, lógica pura) `| test:pdf` (compuertas de PDF reales con Chromium).
`test:pdf` necesita un venv con `pypdf pypdfium2 pillow` en `.venv-gates` y Chromium de Playwright (`npx playwright install chromium`, o `CHROME_PATH=<ruta al chrome>`).

## Cómo agregar un servicio
1. Crear `src/services/<id>.ts` con una `ServiceDefinition` usando las fábricas de `common.ts`.
2. Sumarlo a `src/services/index.ts`.
3. Agregar un fixture en `src/fixtures/index.ts` y su nombre en `scripts/print-gates.mjs`.
4. `npm test` (el test genérico exige ids únicos, variables conocidas y cero marcadores `[…]`) y `npm run test:pdf`.
Si un servicio necesita un tipo de sección nuevo: el tipo en `services/types.ts` + un renderizador en `components/sections/` + su caso en `lib/fields.ts` (una vez para todos).

## Decisiones de Matías (no revertir sin pedirlo)
- Oportunidades comerciales: dato interno, NO sale en el PDF ni en la portada (Camilo, 2026-10-14; la hoja de hallazgos es para el cliente). Siguen en el editor como casilla `no-print`. `commercialOpportunity` queda estructurado para exportar después.
- Vigencias = texto; vencida avisa, nunca bloquea.
- La descripción de las fotos del registro es opcional (2026-10-15); la de las fotos de hallazgos es obligatoria. Máximo 6 fotos en total en el registro del servicio y 6 en total en hallazgos. La foto de portada no cuenta.
- Sin registro de firmas ni tabla de revisiones: sin hoja de «Emisión» (2026-10-13): quien emite (una sola persona) va en la portada junto al folio, siempre Rev. 0; la última sección es «Hallazgos fuera de alcance».
- Editar un informe emitido lo devuelve a borrador.
- **Carta vertical fija**; el contenido fluye y más información da más hojas (no Oficio ni alto a medida: se evaluó el 2026-10-13). Pie distinto al del informe de levantamiento (línea fina + «Página n de N»).

- Justificado SIEMPRE en el cuerpo del documento (`.sheet-body`, con `hyphens: auto`); solo títulos, etiquetas, encabezados de tabla y fichas van a la izquierda. La compuerta de PDF ignora guiones al comparar texto.
- Texto con formato (negrita, listas, párrafos) en todo `EditableText multiline`, con **TipTap** (`components/RichEditor.tsx`, 2026-10-15: antes era contentEditable + execCommand), guardado como HTML mínimo (`lib/richtext.ts`: solo b, ul, ol, li, br; un párrafo vacío = línea en blanco). `.ProseMirror` va con `position: static`: con `relative` el PDF extrae el texto fuera de orden y la compuerta de hallazgos falla. El «Objetivo» también es editable (`keys.objective`). Las celdas de tabla van alineadas a la izquierda (justificado en columnas angostas abre huecos). Fixtures editables: `?fixture=glass&edit=1`. Los anexos se agregan y quitan a mano (`state.annexes`). Se quitó «Equipos y productos» de vidrios (2026-10-13, Matías: eso lo comunica la propuesta técnica).

- **Sin sección de normativa** (2026-10-13, Matías): la normativa vive en la propuesta técnica enviada antes; «Alcance ejecutado» lleva bajo el cuadro una nota enmarcada y editable que remite a ella (`SCOPE_NOTE` en `services/common.ts`, campo `note` de las tablas). Reemplaza el Anexo A del spec y la normativa por modalidad. Sin normativa ya no hay «modalidad de acceso» (se quitó del estado, del panel y de Identificación; los informes guardados con ese dato lo ignoran).

- **Contenido de entrega pensado para varios lectores** (2026-10-13, Matías): gerente de administración, jefe de operaciones, prevención e instalación. Se sumaron: «Resumen del resultado» (texto + cifras de hallazgos y próxima intervención) en Identificación; «Componentes instalados» (tabla) en anclajes; «Observaciones de ejecución» (tabla, ocultable si no hubo desviaciones) en anclajes; el plan de mantención calcula la «Fecha estimada» desde la fecha de ejecución (`dueLabel` en `lib/date.ts`; columna `derive: 'dueDate'`) y lleva la nota de inspección extraordinaria y ciclo posterior; «Anexos» pasó a «Documentos de respaldo» con columna Entrega (incluido en este informe / aparte). Quedaron fuera a propósito: metodología y trabajos ejecutados en texto (van en la propuesta técnica), las imágenes de fichas y certificados, y un registro por punto.

- **Flexibilidad del registro** (2026-10-14/15, Matías): muchas veces no se lleva un registro exacto, así que casi todo se puede ocultar, renombrar o dejar vacío. Títulos de sección y encabezados de tabla son renombrables por informe (`lib/overrides.ts`, claves `keys.title/column` en `values`); `TableColumn.optional` y `noteOptional` dejan celdas/nota sin bloquear (sellos: solo el sector es obligatorio; vidrios: observaciones y condición final opcionales); la descripción de las fotos del registro es opcional. Aún no se pueden agregar/quitar columnas.
- **Lenguaje de administración de edificios en Chile** (Camilo): no usar «estanqueidad» (sellos: «Verificación de filtraciones»), ni «as-built» (no se entregan planos: «Layout de puntos»); «Aparte» se dice «Independiente». Las etiquetas de grupo (Común / Propia del servicio / Cierre) son internas: solo en el panel lateral, nunca en el índice ni en el PDF.
- **La portada muestra de qué cotización y levantamiento viene el informe** (si están enlazados); así el folio queda asociado sin base de datos propia (Camilo, 2026-10-14).
- Pantalla de inicio: botón «Historial» junto a «Crear informe» para abrir un informe guardado sin crear uno. «Marcar como emitido» (antes «Emitir informe») solo pone el sello EMITIDO · REV. 0; imprimir/PDF sirve siempre (borrador sale con sello BORRADOR).

## Invariantes
1. `lib/sections.ts` es el único lugar que numera secciones.
2. Todo texto editable usa `EditableText` (`.editable`, `overflow-wrap: anywhere`). **Una sola cadena larga sin espacios puede encoger todo el PDF** si el documento se ensancha (probado: ~50 %). La compuerta de `scrollWidth` lo vigila.
3. **Paginación nativa**: no se mide nada en JS. `@page` + cajas de margen para el pie; cada sección con `break-before: page`. Las reglas de impresión van fuera de `@layer`.
4. Un texto base nunca afirma un resultado; los datos propios del trabajo quedan vacíos y el validador bloquea si faltan. Sin marcadores `[…]` en las definiciones.
5. `lib/api.ts` es el único lugar que le habla al Worker. La clave de acceso nunca va en una `VITE_*`.
6. Un valor de KV admite 25 MB: `assertWithinSizeLimit` corta a 20 MB antes de enviar.
7. `EditableText` solo llama `onChange` si el texto cambió (si no, pasar el cursor por un informe emitido lo devolvería a borrador).
8. El folio es de solo lectura.
9. Las compuertas de PDF comparan sin distinguir mayúsculas (el CSS usa `text-transform: uppercase`) y omiten lo `.no-print`.

## Requisito de navegador
El pie «Página n de N» usa cajas de margen de `@page` (Chrome/Edge recientes; probado con 153.0.8010.12). En Firefox o Safari el documento sale correcto pero sin pie.

## Pendientes conocidos
- Contenido de vidrios y sellos (secciones, textos, plan de mantención): borrador. Modalidad por defecto por servicio (piso / carro colgante / cuerdas) es una suposición.
- Cargo de quien emite (`DEFAULT_ISSUER` en `services/common.ts`): el Dossier de Ranco traía dos cargos distintos.
- Foto real de portada (velo por defecto) sin ajustar con una foto de Ranco.
- **Desplegado** (2026-10-15): repo `Alto-Test-Spa/entrega-servicio` (rama `main`) → Vercel (Vite, `VITE_REPORTS_ENDPOINT=https://altotest-documentos.altotest.workers.dev`). Camilo lo está probando en producción; guardado, historial y enlaces a cotización/levantamiento ya se usan contra el Worker real. La clave de acceso es la `ACCESS_KEY` de producción del Worker, no la de `.dev.vars`.
