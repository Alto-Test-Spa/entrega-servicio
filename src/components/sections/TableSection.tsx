import type { SectionDef } from '../../services/types'
import { interpolate } from '../../lib/interpolate'
import { dueLabel } from '../../lib/date'
import { padRow } from '../../lib/tables'
import { keys } from '../../lib/keys'
import { EditableText } from '../EditableText'
import { setValue, valueOf, type RenderCtx } from './ctx'

type TableDef = Extract<SectionDef, { kind: 'table' }>

export function TableSection({ section, ctx }: { section: TableDef; ctx: RenderCtx }) {
  const { state, vars, readOnly, update } = ctx
  const rows = state.tables[section.id] ?? section.rows

  const setRows = (next: string[][]) => update((s) => ({ ...s, tables: { ...s.tables, [section.id]: next } }))
  const setCell = (r: number, c: number, v: string) =>
    setRows(rows.map((row, ri) => (ri === r ? padRow(row, section.columns.length).map((cell, ci) => (ci === c ? v : cell)) : row)))

  return (
    <>
      <table className="t t--fixed">
        <thead>
          <tr>
            {section.columns.map((c, ci) => (<th key={ci} style={{ ...(c.width ? { width: c.width } : {}), ...(c.align ? { textAlign: c.align } : {}) }}>
              <EditableText value={c.label} onChange={(v) => setValue(ctx, keys.column(section.id, ci), v)} placeholder={c.label} readOnly={readOnly} />
            </th>))}
            {!readOnly && <th className="no-print" style={{ width: '28px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} data-row>
              {padRow(row, section.columns.length).map((cell, c) => (
                <td key={c} style={section.columns[c].align ? { textAlign: section.columns[c].align } : undefined}>
                  {section.columns[c].derive ? (
                    <span className="derived">{dueLabel(state.shared.executionDate, row[0] ?? '') || '—'}</span>
                  ) : (
                  <EditableText value={interpolate(cell, vars)} onChange={(v) => setCell(r, c, v)} multiline placeholder={section.columns[c].example ? `Ej. ${section.columns[c].example}` : '…'} readOnly={readOnly} />
                  )}
                </td>
              ))}
              {!readOnly && (
                <td className="no-print">
                  <button type="button" className="row-remove" title="Quitar fila" onClick={() => setRows(rows.filter((_, ri) => ri !== r))}>×</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button type="button" className="sbtn no-print" onClick={() => setRows([...rows, section.columns.map(() => '')])}>
          + Agregar fila
        </button>
      )}
      {section.note !== undefined && (
        <>
        {section.noteLabel && <h4>{section.noteLabel}</h4>}
        <div className={`note-box ${section.notePlain ? 'note-box--plain' : ''}`}>
          <EditableText value={valueOf(ctx, keys.note(section.id), section.note)} onChange={(v) => setValue(ctx, keys.note(section.id), v)} multiline placeholder={section.noteLabel ?? 'Nota'} readOnly={readOnly} />
        </div>
        </>
      )}
    </>
  )
}
