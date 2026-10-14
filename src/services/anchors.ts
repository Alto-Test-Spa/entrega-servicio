import {
  SCOPE_COLUMNS, annexesSection, findingsSection, identificationSection,
  maintenanceSection, photosSection, scopeSection,
} from './common'
import type { ServiceDefinition } from './types'

// Basado en el Dossier de Ranco (AT-R-ANC-001-INS00). Los datos propios del trabajo (cantidades,
// técnicos, certificados) quedan vacíos: los llena quien ejecutó, y el validador bloquea si faltan.
// Criterio y ciclo posterior del dossier de Ranco: texto fijo de Alto Test para anclajes.
const MAINTENANCE_NOTE =
  'Se recomienda una evaluación extraordinaria después de cualquier evento que pueda afectar la integridad o la condición de uso del sistema: caída detenida, sobrecarga, impacto, modificación, manipulación no autorizada, daño del sustrato, incendio, intervención constructiva cercana u otra condición que pueda comprometerlo.<br>' +
  'Las actividades de inspección, mantención preventiva y ensayo periódico son servicios posteriores e independientes de la instalación inicial. Alto Test podrá cotizarlos por separado una vez realizada la entrega conforme del proyecto.'

export const anchors: ServiceDefinition = {
  id: 'anchors',
  label: 'Instalación de anclajes',
  codePrefix: 'AT-R-ANC',
  title: 'Instalación y verificación de anclajes',
  intro:
    'Documentar y respaldar técnicamente la instalación y verificación de los sistemas de anclaje ejecutados por Alto Test SpA en {{asset}}, consolidando la trazabilidad del servicio y los antecedentes necesarios para su futura inspección y mantenimiento.',
  sections: [
    identificationSection(),
    scopeSection(SCOPE_COLUMNS, [
      ['01', 'Instalación de sistema de anclaje mecánico sobre perfilería metálica', '', ''],
      ['02', 'Instalación de sistema de anclaje químico sobre elementos de hormigón', '', ''],
      ['03', 'Ensayo no destructivo (END) a anclajes mecánicos instalados', '', ''],
      ['04', 'Ensayo no destructivo (END) a anclajes químicos instalados', '', ''],
    ]),
    {
      id: 'components', title: 'Componentes instalados', group: 'service', kind: 'table',
      columns: [
        { label: 'Componente', width: '24%' },
        { label: 'Marca / modelo', width: '24%', example: 'SafeLink · SteelLink Blind Fastener' },
        { label: 'Especificación', example: 'Sistema de fijación mecánica sobre perfilería metálica' },
        { label: 'Cantidad', width: '12%', example: '14' },
      ],
      rows: [
        ['Anclaje mecánico', '', '', ''],
        ['Adhesivo de anclaje', '', '', ''],
        ['Varilla roscada para anclaje químico', '', '', ''],
        ['Dispositivo / chapa de anclaje', '', '', ''],
        ['Precinto de identificación', '', '', ''],
      ],
    },
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
      id: 'execution', title: 'Observaciones de ejecución', group: 'service', kind: 'table',
      columns: [
        { label: 'Ítem', width: '8%' },
        { label: 'Condición detectada', example: 'Perfil transversal interior que impidió instalar el punto 0014 en su ubicación' },
        { label: 'Acción ejecutada', example: 'Reubicación del punto unos 20 cm, en una zona libre de interferencias' },
      ],
      // Si no hubo desviaciones, la sección se oculta desde el panel «Secciones».
      rows: [['01', '', '']],
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
    ], MAINTENANCE_NOTE),
    annexesSection([
      { letter: 'A', title: 'Fichas técnicas y antecedentes de los componentes instalados', hasValidity: false, delivery: 'included' },
      { letter: 'B', title: 'Certificado de calibración del extractómetro / Pull Tester', hasValidity: true, delivery: 'included' },
      { letter: 'C', title: 'Certificado de calibración de llave de torque', hasValidity: true, delivery: 'included' },
      { letter: 'D', title: 'Certificaciones y/o acreditaciones vigentes del personal técnico responsable', hasValidity: true, delivery: 'included' },
      { letter: 'E', title: 'Certificado de conformidad de instalación Alto Test', hasValidity: true, delivery: 'separate', defaultValidity: 'Validez de 12 meses' },
      { letter: 'F', title: 'Informes de ensayo y trazabilidad (Hydrajaws Verify)', hasValidity: false, delivery: 'separate' },
      { letter: 'G', title: 'Protocolo de uso del sistema de anclajes (AT-PT-ANC-02)', hasValidity: false, delivery: 'separate' },
    ]),
    findingsSection(),
  ],
}
