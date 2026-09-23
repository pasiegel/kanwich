import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ArrowLeft, Plus, Share2 } from 'lucide-react'
import { useKanwichStore } from '../../store/useKanwichStore'
import { BOARD_COLORS } from '../../types'
import TopBar from '../common/TopBar'
import ThemeToggle from '../common/ThemeToggle'
import SoundToggle from '../common/SoundToggle'
import PromptDialog from '../common/PromptDialog'
import Column from './Column'
import CardModal from './CardModal'
import { generateBoardHtml } from '../../lib/staticBoardExport'
import { exportTextFile } from '../../lib/fileBridge'
import { playSound } from '../../lib/sound'

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'board'
}

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const board = useKanwichStore((s) => (boardId ? s.boards[boardId] : undefined))
  const renameBoard = useKanwichStore((s) => s.renameBoard)
  const setBoardColor = useKanwichStore((s) => s.setBoardColor)
  const addColumn = useKanwichStore((s) => s.addColumn)
  const reorderColumns = useKanwichStore((s) => s.reorderColumns)
  const moveCard = useKanwichStore((s) => s.moveCard)

  const [renaming, setRenaming] = useState(false)
  const [addingColumn, setAddingColumn] = useState(false)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!boardId || !board) {
    navigate('/', { replace: true })
    return null
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type as 'card' | 'column' | undefined

    if (activeType === 'column') {
      if (active.id === over.id) return
      const oldIndex = board.columns.findIndex((c) => c.id === active.id)
      const newIndex = board.columns.findIndex((c) => c.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      reorderColumns(
        board.id,
        arrayMove(
          board.columns.map((c) => c.id),
          oldIndex,
          newIndex,
        ),
      )
      return
    }

    if (activeType === 'card') {
      const cardId = active.id as string
      const fromColumnId = active.data.current?.columnId as string
      const overType = over.data.current?.type as 'card' | 'column-list' | undefined

      let toColumnId: string | undefined
      let toIndex = 0

      if (overType === 'card') {
        toColumnId = over.data.current?.columnId as string
        const toColumn = board.columns.find((c) => c.id === toColumnId)
        toIndex = toColumn ? toColumn.cardIds.indexOf(over.id as string) : 0
      } else if (overType === 'column-list') {
        toColumnId = over.data.current?.columnId as string
        const toColumn = board.columns.find((c) => c.id === toColumnId)
        toIndex = toColumn ? toColumn.cardIds.length : 0
      }

      if (!toColumnId) return
      if (toColumnId === fromColumnId) {
        const column = board.columns.find((c) => c.id === fromColumnId)
        if (!column) return
        const fromIndex = column.cardIds.indexOf(cardId)
        if (fromIndex === toIndex || fromIndex === -1) return
      }
      moveCard(board.id, cardId, fromColumnId, toColumnId, toIndex)
    }
  }

  const handleExportBoard = async () => {
    playSound('click')
    const html = generateBoardHtml(board)
    const result = await exportTextFile(html, `${slugify(board.title)}.html`, 'text/html', 'HTML', [
      'html',
    ])
    if (result.message) setStatusMessage(result.message)
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <TopBar
        left={
          <>
            <button
              onClick={() => navigate('/')}
              aria-label="Back to dashboard"
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setColorPickerOpen((v) => !v)}
                aria-label="Change board color"
                className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-950"
                style={{ backgroundColor: board.color }}
              />
              {colorPickerOpen && (
                <div className="absolute left-0 top-6 z-30 flex gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {BOARD_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setBoardColor(board.id, c)
                        setColorPickerOpen(false)
                      }}
                      aria-label={`Set color ${c}`}
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setRenaming(true)}
              className="min-w-0 flex-1 truncate text-left text-lg font-bold"
              title="Rename board"
            >
              {board.title}
            </button>
          </>
        }
        right={
          <>
            <button
              onClick={() => void handleExportBoard()}
              title="Export this board as a standalone, shareable HTML page"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-2.5 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Share2 size={16} /> <span className="hidden sm:inline">Export board</span>
            </button>
            <button
              onClick={() => setAddingColumn(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-2.5 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add column</span>
            </button>
            <SoundToggle />
            <ThemeToggle />
          </>
        }
      />

      {statusMessage && (
        <div
          role="status"
          className="mx-4 mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          {statusMessage}
          <button className="ml-3 underline" onClick={() => setStatusMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 p-4 sm:snap-x sm:snap-proximity sm:overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <SortableContext items={board.columns.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-col gap-4 sm:h-full sm:flex-row sm:items-start">
              {board.columns.map((column) => (
                <Column key={column.id} board={board} column={column} onOpenCard={setOpenCardId} />
              ))}
              {board.columns.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No columns yet &mdash; add one to get started.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      {renaming && (
        <PromptDialog
          title="Rename board"
          label="Board name"
          initialValue={board.title}
          confirmLabel="Save"
          onSubmit={(value) => {
            renameBoard(board.id, value)
            setRenaming(false)
          }}
          onCancel={() => setRenaming(false)}
        />
      )}

      {addingColumn && (
        <PromptDialog
          title="Add column"
          label="Column name"
          placeholder="e.g. Backlog"
          confirmLabel="Add"
          onSubmit={(value) => {
            addColumn(board.id, value)
            playSound('createColumn')
            setAddingColumn(false)
          }}
          onCancel={() => setAddingColumn(false)}
        />
      )}

      {openCardId &&
        board.cards[openCardId] &&
        (() => {
          const card = board.cards[openCardId]
          return <CardModal board={board} card={card} onClose={() => setOpenCardId(null)} />
        })()}
    </div>
  )
}
