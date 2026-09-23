import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus, Upload } from 'lucide-react'
import { useKanwichStore } from '../../store/useKanwichStore'
import TopBar from '../common/TopBar'
import ThemeToggle from '../common/ThemeToggle'
import SoundToggle from '../common/SoundToggle'
import ConfirmDialog from '../common/ConfirmDialog'
import BoardCard from './BoardCard'
import BoardFormModal from './BoardFormModal'
import {
  exportJsonFile,
  importJsonFromBrowserFile,
  importJsonFromElectron,
  isElectron,
} from '../../lib/fileBridge'
import { playSound } from '../../lib/sound'

export default function Dashboard() {
  const navigate = useNavigate()
  const boardOrder = useKanwichStore((s) => s.boardOrder)
  const boards = useKanwichStore((s) => s.boards)
  const createBoard = useKanwichStore((s) => s.createBoard)
  const updateBoard = useKanwichStore((s) => s.updateBoard)
  const deleteBoard = useKanwichStore((s) => s.deleteBoard)
  const exportAll = useKanwichStore((s) => s.exportAll)
  const importAll = useKanwichStore((s) => s.importAll)

  const [newBoardOpen, setNewBoardOpen] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [electronImportConfirmOpen, setElectronImportConfirmOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const orderedBoards = boardOrder.map((id) => boards[id]).filter(Boolean)

  const handleCreateBoard = (values: { title: string; description: string; coverImage?: string }) => {
    setNewBoardOpen(false)
    const id = createBoard(values)
    playSound('createBoard')
    navigate(`/board/${id}`)
  }

  const handleEditBoard = (values: { title: string; description: string; coverImage?: string }) => {
    if (!editingBoardId) return
    updateBoard(editingBoardId, values)
    setEditingBoardId(null)
  }

  const handleExportAll = async () => {
    playSound('click')
    const date = new Date().toISOString().slice(0, 10)
    const result = await exportJsonFile(exportAll(), `kanwich-export-${date}.json`)
    if (result.message) setStatusMessage(result.message)
  }

  const handleImportClick = () => {
    playSound('click')
    if (isElectron()) {
      setElectronImportConfirmOpen(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const applyImport = (data: unknown) => {
    const result = importAll(data)
    setStatusMessage(result.ok ? 'Import complete.' : result.error)
  }

  const confirmBrowserImport = async () => {
    if (!pendingImportFile) return
    const result = await importJsonFromBrowserFile(pendingImportFile)
    if (result.message) setStatusMessage(result.message)
    else applyImport(result.data)
    setPendingImportFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmElectronImport = async () => {
    setElectronImportConfirmOpen(false)
    const result = await importJsonFromElectron()
    if (result.canceled) return
    if (result.message) setStatusMessage(result.message)
    else applyImport(result.data)
  }

  return (
    <div className="min-h-full">
      <TopBar
        left={
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden>🥪</span> Kanwich
          </h1>
        }
        right={
          <>
            <button
              onClick={() => void handleExportAll()}
              disabled={orderedBoards.length === 0}
              title="Export all boards as JSON"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download size={16} /> <span className="hidden sm:inline">Export All</span>
            </button>
            <button
              onClick={handleImportClick}
              title="Import a Kanwich JSON export"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-2.5 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Upload size={16} /> <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setPendingImportFile(file)
              }}
            />
            <SoundToggle />
            <ThemeToggle />
          </>
        }
      />

      <main className="mx-auto max-w-6xl p-6">
        {statusMessage && (
          <div
            role="status"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {statusMessage}
            <button className="ml-3 underline" onClick={() => setStatusMessage(null)}>
              Dismiss
            </button>
          </div>
        )}

        {orderedBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-20 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <p className="text-lg">No boards yet.</p>
            <p className="text-sm">Everything here lives only on this device, until you export it.</p>
            <button
              onClick={() => setNewBoardOpen(true)}
              className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              <Plus size={16} /> Create your first board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={() => navigate(`/board/${board.id}`)}
                onEdit={() => setEditingBoardId(board.id)}
                onDelete={() => setDeleteBoardId(board.id)}
              />
            ))}
            <button
              onClick={() => setNewBoardOpen(true)}
              className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">New board</span>
            </button>
          </div>
        )}
      </main>

      {newBoardOpen && (
        <BoardFormModal
          title="New board"
          confirmLabel="Create"
          onSubmit={handleCreateBoard}
          onCancel={() => setNewBoardOpen(false)}
        />
      )}

      {editingBoardId && boards[editingBoardId] && (
        <BoardFormModal
          title="Edit board"
          confirmLabel="Save"
          initialValues={{
            title: boards[editingBoardId].title,
            description: boards[editingBoardId].description ?? '',
            coverImage: boards[editingBoardId].coverImage,
          }}
          onSubmit={handleEditBoard}
          onCancel={() => setEditingBoardId(null)}
        />
      )}

      {deleteBoardId && (
        <ConfirmDialog
          title="Delete board"
          message={`Delete "${boards[deleteBoardId]?.title}" and all of its cards? This can't be undone unless you have an export.`}
          onConfirm={() => {
            deleteBoard(deleteBoardId)
            playSound('delete')
            setDeleteBoardId(null)
          }}
          onCancel={() => setDeleteBoardId(null)}
        />
      )}

      {pendingImportFile && (
        <ConfirmDialog
          title="Import data"
          message={`Importing "${pendingImportFile.name}" will replace ALL boards currently on this device. Export your current data first if you want to keep it.`}
          confirmLabel="Replace and import"
          onConfirm={() => void confirmBrowserImport()}
          onCancel={() => {
            setPendingImportFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}

      {electronImportConfirmOpen && (
        <ConfirmDialog
          title="Import data"
          message="Importing a file will replace ALL boards currently in this app. Export your current data first if you want to keep it. You'll be asked to choose a file next."
          confirmLabel="Choose file..."
          onConfirm={() => void confirmElectronImport()}
          onCancel={() => setElectronImportConfirmOpen(false)}
        />
      )}
    </div>
  )
}
