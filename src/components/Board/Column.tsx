import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'
import type { BoardT, ColumnT } from '../../types'
import { useKanwichStore } from '../../store/useKanwichStore'
import CardItem from './CardItem'
import ConfirmDialog from '../common/ConfirmDialog'
import { playSound } from '../../lib/sound'

interface ColumnProps {
  board: BoardT
  column: ColumnT
  onOpenCard: (cardId: string) => void
}

export default function Column({ board, column, onOpenCard }: ColumnProps) {
  const addCard = useKanwichStore((s) => s.addCard)
  const renameColumn = useKanwichStore((s) => s.renameColumn)
  const deleteColumn = useKanwichStore((s) => s.deleteColumn)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(column.title)
  const [addingCard, setAddingCard] = useState(false)
  const [cardDraft, setCardDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef: setColumnRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } })

  const { setNodeRef: setListRef } = useDroppable({
    id: `list-${column.id}`,
    data: { type: 'column-list', columnId: column.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const commitTitle = () => {
    setEditingTitle(false)
    if (titleDraft.trim() && titleDraft.trim() !== column.title) {
      renameColumn(board.id, column.id, titleDraft.trim())
    } else {
      setTitleDraft(column.title)
    }
  }

  const commitNewCard = () => {
    if (cardDraft.trim()) {
      addCard(board.id, column.id, cardDraft.trim())
      playSound('createCard')
      setCardDraft('')
    } else {
      setAddingCard(false)
    }
  }

  const cards = column.cardIds.map((id) => board.cards[id]).filter(Boolean)

  return (
    <div
      ref={setColumnRef}
      style={style}
      className="flex w-full shrink-0 flex-col rounded-xl bg-slate-200/60 sm:w-72 sm:snap-center dark:bg-slate-900/60"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex touch-none items-center gap-1.5 rounded-t-xl px-2.5 py-2"
      >
        <GripVertical size={16} className="shrink-0 text-slate-400" />
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') {
                setTitleDraft(column.title)
                setEditingTitle(false)
              }
            }}
            className="min-w-0 flex-1 rounded border border-amber-400 bg-white px-1.5 py-0.5 text-sm font-semibold dark:bg-slate-800"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
            title="Rename column"
          >
            {column.title}
          </button>
        )}
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{cards.length}</span>
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label={`Delete column ${column.title}`}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div ref={setListRef} className="flex min-h-24 flex-1 flex-col gap-2 px-2.5 pb-2">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              board={board}
              columnId={column.id}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="px-2.5 pb-2.5">
        {addingCard ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              autoFocus
              rows={2}
              value={cardDraft}
              onChange={(e) => setCardDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitNewCard()
                }
                if (e.key === 'Escape') {
                  setCardDraft('')
                  setAddingCard(false)
                }
              }}
              placeholder="Card title"
              className="w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={commitNewCard}
                className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
              >
                Add card
              </button>
              <button
                onClick={() => {
                  setCardDraft('')
                  setAddingCard(false)
                }}
                aria-label="Cancel"
                className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-300/50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Plus size={15} /> Add card
          </button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete column"
          message={`Delete "${column.title}" and its ${cards.length} card${cards.length === 1 ? '' : 's'}? This can't be undone.`}
          onConfirm={() => {
            deleteColumn(board.id, column.id)
            playSound('delete')
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
