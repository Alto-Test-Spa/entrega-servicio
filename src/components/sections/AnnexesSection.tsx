import type { AnnexRow } from '../../types'
import type { SectionDef } from '../../services/types'
import { MAX_ANNEXES, annexLetter, effectiveAnnexes, setAnnexes } from '../../lib/annexes'
import { EditableText } from '../EditableText'
import type { RenderCtx } from './ctx'

type AnnexesDef = Extract<SectionDef, { kind: 'annexes' }>

export function AnnexesSection({ section, ctx }: { section: AnnexesDef; ctx: RenderCtx }) {
  const { state, readOnly, update } = ctx
  const rows = effectiveAnnexes(state, section)
  const setRows = (next: AnnexRow[]) => update((s) => setAnnexes(s, section.id, next))
  const patch = (i: number, p: Partial<AnnexRow>) => setRows(rows.map((r, ri) => (ri === i ? { ...r, ...p } : r)))
  return (
    <>
      <table className="t t--fixed">
        <thead>
          <tr>
            <th style={{ width: '8%' }}>N.º</th><th>Documento</th><th style={{ width: '17%' }}>Entrega</th><th style={{ width: '27%' }}>Vigencia</th>
            {!readOnly && <th className="no-print" style={{ width: '28px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <tr key={i} data-row>
              <td className="mono">{annexLetter(i)}</td>
              <td><EditableText value={a.title} onChange={(v) => patch(i, { title: v })} placeholder="Nombre del documento" readOnly={readOnly} /></td>
              <td>
                {readOnly ? (
                  <span className="chip">{a.delivery === 'separate' ? 'Aparte' : 'Incluido'}</span>
                ) : (
                  <button type="button" className="chip chip-btn" title="Clic para cambiar: incluido en este informe o documento aparte"
                    onClick={() => patch(i, { delivery: a.delivery === 'separate' ? 'included' : 'separate' })}>
                    {a.delivery === 'separate' ? 'Aparte' : 'Incluido'}
                  </button>
                )}
              </td>
              <td>
                {a.hasValidity ? (
                  <>
                    <EditableText value={a.validity} onChange={(v) => patch(i, { validity: v })} placeholder="Ej. vigente hasta 12.03.2027" readOnly={readOnly} />
                    {!readOnly && <button type="button" className="link-btn no-print" onClick={() => patch(i, { hasValidity: false, validity: '' })}>sin vigencia</button>}
                  </>
                ) : readOnly ? (
                  <span className="chip">No aplica</span>
                ) : (
                  <button type="button" className="chip chip-btn" title="Clic para pedir vigencia" onClick={() => patch(i, { hasValidity: true })}>No aplica</button>
                )}
              </td>
              {!readOnly && (
                <td className="no-print">
                  <button type="button" className="row-remove" title="Quitar anexo" onClick={() => setRows(rows.filter((_, ri) => ri !== i))}>×</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button type="button" className="sbtn no-print" disabled={rows.length >= MAX_ANNEXES}
          onClick={() => setRows([...rows, { title: '', hasValidity: false, validity: '', delivery: 'included' }])}>
          + Agregar anexo
        </button>
      )}
      <p className="hint">Incluido = va dentro de este informe · Aparte = se entrega como documento independiente.</p>
      <p className="hint no-print">La vigencia es texto libre. Una fecha vencida avisa antes de emitir, pero no bloquea.</p>
    </>
  )
}
