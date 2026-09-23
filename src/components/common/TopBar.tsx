import type { ReactNode } from 'react'

interface TopBarProps {
  left: ReactNode
  right?: ReactNode
}

export default function TopBar({ left, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">{left}</div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">{right}</div>
    </header>
  )
}
