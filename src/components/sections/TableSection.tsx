import type { SectionDef } from '../../services/types'
import { interpolate } from '../../lib/interpolate'
import { EditableText } from '../EditableText'
import type { RenderCtx } from './ctx'

type TableDef = Extract<SectionDef, { kind: 'table' }>

export function TableSection({ section, ctx }: { section: TableDef; ctx: RenderCtx }) {
  const { state, vars, readOnly, update } = ctx
  const rows = state.tables[section.id] ?? section.rows

  const setRows = (next: string[][]) => update((s) => ({ ...s, tables: { ...s.tables, [section.id]: next } }))
  const setCell = (r: number, c: number, v: string) =>
    setRows(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)))

  return (
    <>
      <table className="t t--fixed">
        <thead>
          <tr>
            {section.columns.map((c) => (<th key={c.label} style={c.width ? { width: c.width } : undefined}>{c.label}</th>))}
            {!readOnly && <th className="no-print" style={{ width: '28px' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} data-row>
              {row.map((cell, c) => (
                <td key={c}>
                  <EditableText value={interpolate(cell, vars)} onChange={(v) => setCell(r, c, v)} multiline placeholder="…" readOnly={readOnly} />
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
    </>
  )
}
