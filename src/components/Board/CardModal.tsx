import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Plus, Tag, Trash2, X } from 'lucide-react'
import type { BoardT, CardT } from '../../types'
import { LABEL_COLORS } from '../../types'
import { useKanwichStore } from '../../store/useKanwichStore'
import { compressImageToDataUrl } from '../../lib/image'
import Modal from '../common/Modal'
import ConfirmDialog from '../common/ConfirmDialog'
import { playSound } from '../../lib/sound'

interface CardModalProps {
  board: BoardT
  card: CardT
  onClose: () => void
}

export default function CardModal({ board, card, onClose }: CardModalProps) {
  const updateCard = useKanwichStore((s) => s.updateCard)
  const deleteCard = useKanwichStore((s) => s.deleteCard)
  const addSubtask = useKanwichStore((s) => s.addSubtask)
  const toggleSubtask = useKanwichStore((s) => s.toggleSubtask)
  const deleteSubtask = useKanwichStore((s) => s.deleteSubtask)
  const addLabel = useKanwichStore((s) => s.addLabel)
  const toggleCardLabel = useKanwichStore((s) => s.toggleCardLabel)

  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [newSubtask, setNewSubtask] = useState('')
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState<string>(LABEL_COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(card.title)
    setDescription(card.description ?? '')
  }, [card.id, card.title, card.description])

  const commitTitle = () => {
    if (title.trim() && title.trim() !== card.title) {
      updateCard(board.id, card.id, { title: title.trim() })
    } else {
      setTitle(card.title)
    }
  }

  const commitDescription = () => {
    if (description !== (card.description ?? '')) {
      updateCard(board.id, card.id, { description })
    }
  }

  // Escape / backdrop-click close the modal without blurring whatever
  // input is focused, so onBlur alone would silently drop an in-progress
  // title/description edit. Flush both before actually closing.
  const handleClose = () => {
    commitTitle()
    commitDescription()
    onClose()
  }

  const handleImageSelected = async (file: File) => {
    setImageError(null)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      updateCard(board.id, card.id, { coverImage: dataUrl })
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not add that image.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    addSubtask(board.id, card.id, newSubtask.trim())
    setNewSubtask('')
  }

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return
    addLabel(board.id, newLabelName.trim(), newLabelColor)
    setNewLabelName('')
    setAddingLabel(false)
  }

  const labelsHeader = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag size={13} className="shrink-0 text-slate-400" />
      {board.labels.map((label) => {
        const active = card.labelIds.includes(label.id)
        return (
          <button
            key={label.id}
            onClick={() => toggleCardLabel(board.id, card.id, label.id)}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-white transition"
            style={{ backgroundColor: label.color, opacity: active ? 1 : 0.35 }}
          >
            {label.name}
          </button>
        )
      })}
      {addingLabel ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
            placeholder="Label name"
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setNewLabelColor(c)}
              aria-label={`Color ${c}`}
              className="h-5 w-5 rounded-full"
              style={{
                backgroundColor: c,
                outline: c === newLabelColor ? '2px solid currentColor' : 'none',
                outlineOffset: '1px',
              }}
            />
          ))}
          <button
            onClick={handleAddLabel}
            className="rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingLabel(true)}
          className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400"
        >
          + New label
        </button>
      )}
    </div>
  )

  return (
    <Modal title="Card" onClose={handleClose} widthClassName="max-w-xl" headerExtra={labelsHeader}>
      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
        {card.coverImage ? (
          <div className="relative">
            <img src={card.coverImage} alt="" className="max-h-48 w-full rounded-lg object-cover" />
            <button
              onClick={() => updateCard(board.id, card.id, { coverImage: undefined })}
              className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white hover:bg-black/80"
            >
              Remove image
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400"
          >
            <ImagePlus size={16} /> Add cover image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImageSelected(file)
          }}
        />
        {imageError && <p className="text-xs text-red-600 dark:text-red-400">{imageError}</p>}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className="w-full rounded-md border border-transparent bg-transparent px-1 text-lg font-semibold outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 dark:focus:bg-slate-800"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Due date
            <input
              type="date"
              value={card.dueDate ? card.dueDate.slice(0, 10) : ''}
              onChange={(e) =>
                updateCard(board.id, card.id, { dueDate: e.target.value || undefined })
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Description
          </p>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commitDescription}
            placeholder="Add a more detailed description..."
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Subtasks{' '}
            {card.subtasks.length > 0 &&
              `(${card.subtasks.filter((s) => s.completed).length}/${card.subtasks.length})`}
          </p>
          <div className="flex flex-col gap-1">
            {card.subtasks.map((st) => (
              <label
                key={st.id}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => toggleSubtask(board.id, card.id, st.id)}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className={`flex-1 text-sm ${st.completed ? 'text-slate-400 line-through' : ''}`}>
                  {st.title}
                </span>
                <button
                  onClick={() => deleteSubtask(board.id, card.id, st.id)}
                  aria-label={`Delete subtask ${st.title}`}
                  className="rounded p-0.5 text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </label>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add a subtask"
              className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              onClick={handleAddSubtask}
              aria-label="Add subtask"
              className="rounded-md bg-slate-200 p-1.5 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            Updated {new Date(card.updatedAt).toLocaleString()}
          </p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 size={15} /> Delete card
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete card"
          message={`Delete "${card.title}"? This can't be undone.`}
          onConfirm={() => {
            deleteCard(board.id, card.id)
            playSound('delete')
            setConfirmDelete(false)
            onClose()
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </Modal>
  )
}
