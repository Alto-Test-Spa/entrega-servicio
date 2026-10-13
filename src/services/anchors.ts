import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection, issuanceSection,
  maintenanceSection, normativeSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Basado en el Dossier de Ranco (AT-R-ANC-001-INS00). Los datos propios del trabajo (cantidades,
// técnicos, certificados) quedan vacíos: los llena quien ejecutó, y el validador bloquea si faltan.
export const anchors: ServiceDefinition = {
  id: 'anchors',
  label: 'Instalación de anclajes',
  codePrefix: 'AT-R-ANC',
  defaultAccessMode: 'ground',
  title: 'Instalación y verificación de anclajes',
  intro:
    'Documentar y respaldar técnicamente la instalación y verificación de los sistemas de anclaje ejecutados por Alto Test SpA en {{asset}}, consolidando la trazabilidad del servicio y los antecedentes necesarios para su futura inspección y mantenimiento.',
  normative: [
    { id: 'en-795', text: 'EN 795:2012 · Dispositivos de anclaje', status: 'validated' },
    { id: 'en-365', text: 'EN 365:2004 · Requisitos generales de uso e instrucciones', status: 'validated' },
    { id: 'nch-1258', text: 'NCh 1258 · Equipos de protección personal contra caídas', status: 'validated' },
    { id: 'ds-594', text: 'D.S. N°594 · Condiciones sanitarias y ambientales básicas en los lugares de trabajo', status: 'validated' },
  ],
  sections: [
    identificationSection(),
    normativeSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Instalación de sistema de anclaje mecánico sobre perfilería metálica', '', ''],
      ['02', 'Instalación de sistema de anclaje químico sobre elementos de hormigón', '', ''],
      ['03', 'Ensayo no destructivo (END) a anclajes mecánicos instalados', '', ''],
      ['04', 'Ensayo no destructivo (END) a anclajes químicos instalados', '', ''],
    ]),
    {
      id: 'tests', title: 'Resultados de ensayos', group: 'service', kind: 'facts',
      facts: [
        { label: 'Tipo de ensayo', value: 'Proof test / ensayo no destructivo' },
        { label: 'Equipo', value: '', hint: 'Marca, modelo y N.º de serie del extractómetro' },
        { label: 'Certificado de calibración', value: '', validity: true, hint: 'N.º de certificado y vigencia (ej. N.º 123 · vigente hasta 12.03.2027)' },
        { label: 'Criterio de ensayo', value: '', hint: 'Carga y tiempo (ej. 6 kN · 60 s)' },
        { label: 'Fecha de ensayo', value: '{{executionDate}}' },
        { label: 'Técnicos responsables', value: '', hint: 'Nombres de quienes ejecutaron los ensayos' },
      ],
      conclusionHint: 'Resultado de los ensayos frente al criterio de aceptación',
    },
    {
      id: 'layout', title: 'Layout de puntos / As-built', group: 'service', kind: 'layout',
      instruction: 'Sube el plano, layout o croquis final con la ubicación real y la codificación de los elementos intervenidos.',
      legend: 'Plano de ubicación y codificación de los puntos intervenidos en {{asset}}.',
    },
    photosSection(),
    maintenanceSection([
      ['6 meses', 'Inspección + mantención preventiva', 'Revisión general, limpieza, identificación, componentes, marcas de control y condición visible del sustrato.'],
      ['12 meses', 'Ensayo no destructivo de carga', 'Ensayo de los puntos conforme al criterio técnico aplicable y registro de resultados.'],
      ['18 meses', 'Inspección + mantención preventiva', 'Nueva revisión general y mantención preventiva.'],
      ['24 meses', 'Ensayo no destructivo de carga', 'Nuevo ciclo de ensayos y registro de resultados.'],
    ]),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas y antecedentes de los componentes instalados', hasValidity: false },
      { letter: 'B', title: 'Certificado de calibración del extractómetro / Pull Tester', hasValidity: true },
      { letter: 'C', title: 'Certificado de calibración de llave de torque', hasValidity: true },
      { letter: 'D', title: 'Certificaciones y/o acreditaciones vigentes del personal técnico responsable', hasValidity: true },
    ]),
    findingsSection(),
    issuanceSection(),
  ],
}
