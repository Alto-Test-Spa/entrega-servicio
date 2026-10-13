import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import { GENERAL_NORMATIVE } from './normative'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test. La duración de la prueba de riego NO se inventa: queda vacía
// hasta que se fije con AAMA 501.2 u otro procedimiento propio.
export const seals: ServiceDefinition = {
  id: 'seals',
  label: 'Reposición de sellos',
  codePrefix: 'AT-R-SEL',
  defaultAccessMode: 'rope',
  title: 'Reposición de sellos de fachada',
  intro:
    'Registrar la reposición de sellos ejecutada en {{asset}}: ubicación, tipo de sellante, longitudes intervenidas y pruebas de estanqueidad posteriores.',
  normative: [
    ...GENERAL_NORMATIVE,
    { id: 'astm-c920', text: 'ASTM C920 / ISO 11600 · Selladores elastoméricos para juntas de construcción', status: 'to_validate' },
    { id: 'en-15651-2', text: 'EN 15651-2:2017 · Selladores de acristalamiento de uso no estructural', status: 'to_validate' },
    { id: 'astm-c1193', text: 'ASTM C1193 · Guía para el uso de selladores de juntas', status: 'to_validate' },
    { id: 'aama-501-2', text: 'AAMA 501.2 · Prueba de riego en terreno para muros cortina y fachadas', status: 'to_validate' },
    { id: 'astm-c1521', text: 'ASTM C1521 · Evaluación de adherencia de selladores instalados', status: 'to_validate' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Retiro de sellos degradados en fachada', '', ''],
      ['02', 'Limpieza y preparación de juntas', '', ''],
      ['03', 'Aplicación de sellante', '', ''],
    ]),
    {
      id: 'replaced', title: 'Sellos repuestos', group: 'service', kind: 'table',
      columns: [{ label: 'Ubicación' }, { label: 'Tipo de sello', width: '26%' }, { label: 'Longitud', width: '14%' }, { label: 'Curado / control', width: '24%' }],
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
      { letter: 'A', title: 'Ficha técnica y lote del sellante', hasValidity: true },
      { letter: 'B', title: 'Garantía de aplicación', hasValidity: false },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
