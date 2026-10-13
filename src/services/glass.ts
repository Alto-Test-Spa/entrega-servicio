import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import { GENERAL_NORMATIVE } from './normative'
import type { ServiceDefinition } from './types'

// Borrador a validar por Alto Test (secciones, textos base y plan de mantención). Los textos no
// afirman resultados; los datos del trabajo quedan vacíos para que los llene quien ejecutó.
export const glass: ServiceDefinition = {
  id: 'glass',
  label: 'Limpieza de vidrios',
  codePrefix: 'AT-R-VID',
  defaultAccessMode: 'suspended_platform',
  title: 'Limpieza de fachadas vidriadas',
  intro:
    'Dejar constancia de la limpieza de fachadas vidriadas ejecutada en {{asset}}, con detalle de los sectores intervenidos, el método de acceso y la condición final de los paños.',
  normative: [
    ...GENERAL_NORMATIVE,
    { id: 'ansi-iwca', text: 'ANSI/IWCA I-14.1 · Seguridad en la limpieza de ventanas (referencia internacional)', status: 'to_validate' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Limpieza de vidrios de fachada', '', ''],
      ['02', 'Limpieza de marcos y perfiles de aluminio', '', ''],
      ['03', 'Retiro de residuos en antepechos', '', ''],
    ]),
    {
      id: 'sectors', title: 'Sectores intervenidos', group: 'service', kind: 'table',
      columns: [{ label: 'Sector' }, { label: 'Paños', width: '14%' }, { label: 'Superficie', width: '18%' }, { label: 'Estado final', width: '22%' }],
      rows: [['', '', '', '']],
    },
    {
      id: 'equipment', title: 'Equipos y productos', group: 'service', kind: 'facts',
      facts: [
        { label: 'Producto limpiador', value: '', hint: 'Producto y dilución utilizados' },
        { label: 'Herramientas', value: '', hint: 'Rasquetas, mopas, lavavidrios…' },
        { label: 'Personal en terreno', value: '', hint: 'Cantidad de operadores y supervisor' },
        { label: 'Equipo de acceso', value: '{{accessEquipment}}' },
      ],
      conclusionHint: 'Condición final de los paños y observaciones del trabajo',
    },
    photosSection(),
    maintenanceSection([
      ['3 meses', 'Limpieza de fachadas expuestas', 'Sectores con mayor exposición a polvo y tráfico.'],
      ['6 meses', 'Limpieza integral', 'Todos los sectores, marcos y antepechos.'],
      ['12 meses', 'Inspección de sellos y marcos', 'Revisión visual de sellos y fijaciones.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas de los productos utilizados', hasValidity: false },
      { letter: 'B', title: 'Credenciales del personal de altura', hasValidity: true },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
