import { Pencil, Trash2 } from 'lucide-react'
import type { BoardT } from '../../types'

interface BoardCardProps {
  board: BoardT
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function BoardCard({ board, onOpen, onEdit, onDelete }: BoardCardProps) {
  const cardCount = Object.keys(board.cards).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {board.coverImage ? (
        <img src={board.coverImage} alt="" className="h-28 w-full object-cover" />
      ) : (
        <div className="h-2" style={{ backgroundColor: board.color }} />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-base font-semibold">{board.title}</h3>
        {board.description && (
          <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {board.description}
          </p>
        )}
        <p className="mt-auto pt-1 text-xs text-slate-400 dark:text-slate-500">
          {board.columns.length} column{board.columns.length === 1 ? '' : 's'} &middot; {cardCount}{' '}
          card{cardCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label={`Edit board ${board.title}`}
          className="rounded-md bg-white/90 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Delete board ${board.title}`}
          className="rounded-md bg-white/90 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:bg-slate-900/90 dark:hover:bg-red-950"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
