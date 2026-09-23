import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClock, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react'
import type { BoardT, CardT } from '../../types'
import { useKanwichStore } from '../../store/useKanwichStore'

interface CardItemProps {
  card: CardT
  board: BoardT
  columnId: string
  onOpen: () => void
}

function isOverdue(dueDate: string, allSubtasksDone: boolean): boolean {
  if (allSubtasksDone) return false
  return new Date(dueDate).getTime() < Date.now()
}

export default function CardItem({ card, board, columnId, onOpen }: CardItemProps) {
  const toggleSubtask = useKanwichStore((s) => s.toggleSubtask)
  const [expanded, setExpanded] = useState(true)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const labels = card.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter(Boolean)
  const totalSubtasks = card.subtasks.length
  const doneSubtasks = card.subtasks.filter((s) => s.completed).length
  const allDone = totalSubtasks > 0 && doneSubtasks === totalSubtasks

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className="cursor-pointer touch-none overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {card.coverImage && (
        <img src={card.coverImage} alt="" className="h-28 w-full object-cover" />
      )}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-3 pb-1.5 pt-2 dark:border-slate-700/60">
          {labels.map((l) => (
            <span
              key={l!.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: l!.color }}
            >
              {l!.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-sm font-medium leading-snug">{card.title}</p>
        {(totalSubtasks > 0 || card.dueDate) && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {totalSubtasks > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((v) => !v)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-expanded={expanded}
                aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
                className={`-mx-1 flex items-center gap-1 rounded px-1 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  allDone ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <CheckSquare size={13} />
                {doneSubtasks}/{totalSubtasks}
              </button>
            )}
            {card.dueDate && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue(card.dueDate, allDone) ? 'font-semibold text-red-600 dark:text-red-400' : ''
                }`}
              >
                <CalendarClock size={13} />
                {new Date(card.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        {expanded && totalSubtasks > 0 && (
          <ul
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex flex-col gap-1 border-t border-slate-100 pt-1.5 dark:border-slate-700/60"
          >
            {card.subtasks.map((st) => (
              <li key={st.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => toggleSubtask(board.id, card.id, st.id)}
                  className="h-3.5 w-3.5 shrink-0 accent-amber-500"
                />
                <span
                  className={`text-xs leading-snug ${
                    st.completed ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
