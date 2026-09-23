import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import Modal from '../common/Modal'
import { compressImageToDataUrl } from '../../lib/image'

interface BoardFormValues {
  title: string
  description: string
  coverImage?: string
}

interface BoardFormModalProps {
  title: string
  confirmLabel: string
  initialValues?: Partial<BoardFormValues>
  onSubmit: (values: BoardFormValues) => void
  onCancel: () => void
}

export default function BoardFormModal({
  title,
  confirmLabel,
  initialValues,
  onSubmit,
  onCancel,
}: BoardFormModalProps) {
  const [boardTitle, setBoardTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [coverImage, setCoverImage] = useState(initialValues?.coverImage)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelected = async (file: File) => {
    setImageError(null)
    try {
      setCoverImage(await compressImageToDataUrl(file))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not add that image.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!boardTitle.trim()) return
    onSubmit({ title: boardTitle.trim(), description: description.trim(), coverImage })
  }

  return (
    <Modal title={title} onClose={onCancel} widthClassName="max-w-lg">
      <div className="flex flex-col gap-4">
        {coverImage ? (
          <div className="relative">
            <img src={coverImage} alt="" className="max-h-40 w-full rounded-lg object-cover" />
            <button
              onClick={() => setCoverImage(undefined)}
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Board name
          </label>
          <input
            autoFocus
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            placeholder="e.g. Website Relaunch"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this board for?"
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!boardTitle.trim()}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
