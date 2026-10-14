import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection,
  maintenanceSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test. Sin duración de prueba inventada: el método y el resultado los escribe quien ejecutó.
export const seals: ServiceDefinition = {
  id: 'seals',
  label: 'Reposición de sellos',
  codePrefix: 'AT-R-SEL',
  title: 'Reposición de sellos de fachada',
  intro:
    'Registrar la reposición de sellos ejecutada en {{asset}}: ubicación, tipo de sellante, longitudes intervenidas y verificación de filtraciones posterior.',
  sections: [
    identificationSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Retiro de sellos degradados en fachada', '', ''],
      ['02', 'Limpieza y preparación de juntas', '', ''],
      ['03', 'Aplicación de sellante', '', ''],
    ]),
    {
      id: 'replaced', title: 'Sellos repuestos', group: 'service', kind: 'table',
      // Muchas veces no se lleva un registro tan exacto: solo el sector es obligatorio; el resto se
      // completa si existe, y las columnas se pueden renombrar.
      columns: [
        { label: 'Sector / fachada', example: 'Cara norte, piso 5' },
        { label: 'Desde', width: '13%', optional: true, example: 'Piso 5' },
        { label: 'Hasta', width: '13%', optional: true, example: 'Piso 8' },
        { label: 'Longitud total', width: '15%', align: 'center', optional: true, example: '120 m' },
        { label: 'Tipo de sello', width: '20%', optional: true, example: 'Silicona estructural' },
      ],
      rows: [['', '', '', '', '']],
      note: '', noteLabel: 'Observaciones del trabajo', noteOptional: true,
    },
    {
      id: 'watertightness', title: 'Verificación de filtraciones', group: 'service', kind: 'facts',
      facts: [
        { label: 'Método', value: '', hint: 'Por ejemplo riego controlado sobre la junta' },
        { label: 'Sectores verificados', value: '', hint: 'Dónde se probó' },
        { label: 'Resultado', value: '', hint: 'Qué se observó' },
      ],
      conclusionHint: 'Resultado de la verificación una vez cumplido el tiempo de curado',
    },
    photosSection(),
    maintenanceSection([
      ['6 meses', 'Inspección visual de sellos', 'Revisión de adherencia y grietas.'],
      ['12 meses', 'Verificación de filtraciones', 'Muestreo de juntas críticas.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Ficha técnica y lote del sellante', hasValidity: true, delivery: 'included' },
      { letter: 'B', title: 'Garantía de aplicación', hasValidity: false, delivery: 'included' },
    ]),
    findingsSection(),
  ],
}
