import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection,
  maintenanceSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test (secciones, textos base y plan de mantención). Los textos no
// afirman resultados; los datos del trabajo quedan vacíos para que los llene quien ejecutó.
export const glass: ServiceDefinition = {
  id: 'glass',
  label: 'Limpieza de vidrios',
  codePrefix: 'AT-R-VID',
  title: 'Limpieza de fachadas vidriadas',
  intro:
    'Dejar constancia de la limpieza de fachadas vidriadas ejecutada en {{asset}}, con detalle de los sectores intervenidos, el método de acceso y la condición final de los paños.',
  sections: [
    identificationSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Limpieza de vidrios de fachada', '', ''],
      ['02', 'Limpieza de marcos y perfiles de aluminio', '', ''],
      ['03', 'Retiro de residuos en antepechos', '', ''],
    ]),
    {
      id: 'sectors', title: 'Sectores intervenidos', group: 'service', kind: 'table',
      columns: [
        { label: 'Sector / fachada', width: '20%', example: 'Cara poniente' },
        { label: 'Desde', width: '11%', example: 'Azotea' },
        { label: 'Hasta', width: '11%', example: 'Piso 1' },
        { label: 'Superficie', width: '22%', example: 'Cristal' },
        { label: 'Observaciones', optional: true, example: 'Sin novedades' },
      ],
      rows: [['', '', '', '', '']],
      // Sin texto base: cómo quedó el trabajo lo escribe quien lo ejecutó.
      note: '', noteLabel: 'Condición final del trabajo', noteOptional: true,
    },
    photosSection(),
    maintenanceSection([
      ['3 meses', 'Limpieza de fachadas expuestas', 'Sectores con mayor exposición a polvo y tráfico.'],
      ['6 meses', 'Limpieza integral', 'Todos los sectores, marcos y antepechos.'],
      ['12 meses', 'Inspección de sellos y marcos', 'Revisión visual de sellos y fijaciones.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas de los productos utilizados', hasValidity: false, delivery: 'included' },
      { letter: 'B', title: 'Credenciales del personal de altura', hasValidity: true, delivery: 'included' },
    ]),
    findingsSection(),
  ],
}
