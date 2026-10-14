import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection,
  maintenanceSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test. La duración de la prueba de riego NO se inventa: queda vacía
// hasta que se fije con AAMA 501.2 u otro procedimiento propio.
export const seals: ServiceDefinition = {
  id: 'seals',
  label: 'Reposición de sellos',
  codePrefix: 'AT-R-SEL',
  title: 'Reposición de sellos de fachada',
  intro:
    'Registrar la reposición de sellos ejecutada en {{asset}}: ubicación, tipo de sellante, longitudes intervenidas y pruebas de estanqueidad posteriores.',
  sections: [
    identificationSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Retiro de sellos degradados en fachada', '', ''],
      ['02', 'Limpieza y preparación de juntas', '', ''],
      ['03', 'Aplicación de sellante', '', ''],
    ]),
    {
      id: 'replaced', title: 'Sellos repuestos', group: 'service', kind: 'table',
      columns: [{ label: 'Ubicación', example: 'Junta vertical, cara norte, piso 5' }, { label: 'Tipo de sello', width: '26%', example: 'Silicona estructural' }, { label: 'Longitud', width: '14%', example: '12 m' }, { label: 'Curado / control', width: '24%', example: 'Revisado a las 24 h' }],
      rows: [['', '', '', '']],
    },
    {
      id: 'watertightness', title: 'Pruebas de estanqueidad', group: 'service', kind: 'facts',
      facts: [
        { label: 'Método', value: '', hint: 'Por ejemplo riego controlado sobre la junta' },
        { label: 'Duración por tramo', value: '', hint: 'Según el protocolo definido (AAMA 501.2 u otro)' },
        { label: 'Tramos evaluados', value: '', hint: 'Cantidad de tramos probados' },
        { label: 'Resultado', value: '', hint: 'Resultado observado en cada tramo' },
      ],
      conclusionHint: 'Resultado de las pruebas una vez cumplido el tiempo de curado',
    },
    photosSection(),
    maintenanceSection([
      ['6 meses', 'Inspección visual de sellos', 'Revisión de adherencia y grietas.'],
      ['12 meses', 'Prueba de estanqueidad', 'Muestreo de juntas críticas.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Ficha técnica y lote del sellante', hasValidity: true, delivery: 'included' },
      { letter: 'B', title: 'Garantía de aplicación', hasValidity: false, delivery: 'included' },
    ]),
    findingsSection(),
  ],
}
