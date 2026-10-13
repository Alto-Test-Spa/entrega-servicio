import type { ReactNode } from 'react'

export function SidePanel({ children }: { children: ReactNode }) {
  return <aside className="side-panel no-print">{children}</aside>
}
