import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import { newId } from '../lib/id'
import {
  BOARD_COLORS,
  SCHEMA_VERSION,
  type BoardT,
  type CardT,
  type KanwichExport,
  type Label,
} from '../types'

interface KanwichState {
  boards: Record<string, BoardT>
  boardOrder: string[]
  theme: 'light' | 'dark'
  soundEnabled: boolean

  // Board
  createBoard: (data: {
    title: string
    description?: string
    coverImage?: string
    color?: string
  }) => string
  renameBoard: (boardId: string, title: string) => void
  setBoardColor: (boardId: string, color: string) => void
  updateBoard: (
    boardId: string,
    patch: Partial<Pick<BoardT, 'title' | 'description' | 'coverImage' | 'color'>>,
  ) => void
  deleteBoard: (boardId: string) => void
  reorderBoards: (newOrder: string[]) => void

  // Column
  addColumn: (boardId: string, title: string) => void
  renameColumn: (boardId: string, columnId: string, title: string) => void
  deleteColumn: (boardId: string, columnId: string) => void
  reorderColumns: (boardId: string, newColumnOrder: string[]) => void

  // Card
  addCard: (boardId: string, columnId: string, title: string) => void
  updateCard: (boardId: string, cardId: string, patch: Partial<CardT>) => void
  deleteCard: (boardId: string, cardId: string) => void
  moveCard: (
    boardId: string,
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ) => void

  // Subtasks
  addSubtask: (boardId: string, cardId: string, title: string) => void
  toggleSubtask: (boardId: string, cardId: string, subtaskId: string) => void
  deleteSubtask: (boardId: string, cardId: string, subtaskId: string) => void

  // Labels
  addLabel: (boardId: string, name: string, color: string) => void
  deleteLabel: (boardId: string, labelId: string) => void
  toggleCardLabel: (boardId: string, cardId: string, labelId: string) => void

  // Theme
  toggleTheme: () => void

  // Sound effects
  toggleSound: () => void

  // Import / export / seeding
  exportAll: () => KanwichExport
  importAll: (data: unknown) => { ok: true } | { ok: false; error: string }
  hydrateFromDefaultFile: () => Promise<void>
}

function now(): string {
  return new Date().toISOString()
}

function touchBoard(board: BoardT): BoardT {
  return { ...board, updatedAt: now() }
}

function isValidExport(data: unknown): data is KanwichExport {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.schemaVersion === 'number' &&
    typeof d.boards === 'object' &&
    d.boards !== null &&
    Array.isArray(d.boardOrder)
  )
}

export const useKanwichStore = create<KanwichState>()(
  persist(
    (set, get) => ({
      boards: {},
      boardOrder: [],
      theme: 'light',
      soundEnabled: true,

      createBoard: ({ title, description, coverImage, color }) => {
        const id = newId()
        const board: BoardT = {
          id,
          title: title.trim() || 'Untitled board',
          description: description?.trim() || undefined,
          coverImage,
          color: color ?? BOARD_COLORS[Object.keys(get().boards).length % BOARD_COLORS.length],
          columns: [
            { id: newId(), title: 'To Do', cardIds: [] },
            { id: newId(), title: 'In Progress', cardIds: [] },
            { id: newId(), title: 'Done', cardIds: [] },
          ],
          cards: {},
          labels: [],
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({
          boards: { ...s.boards, [id]: board },
          boardOrder: [...s.boardOrder, id],
        }))
        return id
      },

      renameBoard: (boardId, title) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({ ...board, title: title.trim() || board.title }),
            },
          }
        })
      },

      setBoardColor: (boardId, color) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          return { boards: { ...s.boards, [boardId]: touchBoard({ ...board, color }) } }
        })
      },

      updateBoard: (boardId, patch) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          return { boards: { ...s.boards, [boardId]: touchBoard({ ...board, ...patch }) } }
        })
      },

      deleteBoard: (boardId) => {
        set((s) => {
          const boards = { ...s.boards }
          delete boards[boardId]
          return { boards, boardOrder: s.boardOrder.filter((id) => id !== boardId) }
        })
      },

      reorderBoards: (newOrder) => set({ boardOrder: newOrder }),

      addColumn: (boardId, title) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const column = { id: newId(), title: title.trim() || 'New column', cardIds: [] }
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({ ...board, columns: [...board.columns, column] }),
            },
          }
        })
      },

      renameColumn: (boardId, columnId, title) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                columns: board.columns.map((c) =>
                  c.id === columnId ? { ...c, title: title.trim() || c.title } : c,
                ),
              }),
            },
          }
        })
      },

      deleteColumn: (boardId, columnId) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const column = board.columns.find((c) => c.id === columnId)
          if (!column) return s
          const cards = { ...board.cards }
          for (const cardId of column.cardIds) delete cards[cardId]
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                columns: board.columns.filter((c) => c.id !== columnId),
                cards,
              }),
            },
          }
        })
      },

      reorderColumns: (boardId, newColumnOrder) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const byId = new Map(board.columns.map((c) => [c.id, c]))
          const columns = newColumnOrder.map((id) => byId.get(id)!).filter(Boolean)
          return { boards: { ...s.boards, [boardId]: touchBoard({ ...board, columns }) } }
        })
      },

      addCard: (boardId, columnId, title) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const id = newId()
          const card: CardT = {
            id,
            title: title.trim() || 'Untitled card',
            subtasks: [],
            labelIds: [],
            createdAt: now(),
            updatedAt: now(),
          }
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: { ...board.cards, [id]: card },
                columns: board.columns.map((c) =>
                  c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c,
                ),
              }),
            },
          }
        })
      },

      updateCard: (boardId, cardId, patch) => {
        set((s) => {
          const board = s.boards[boardId]
          const card = board?.cards[cardId]
          if (!board || !card) return s
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: {
                  ...board.cards,
                  [cardId]: { ...card, ...patch, updatedAt: now() },
                },
              }),
            },
          }
        })
      },

      deleteCard: (boardId, cardId) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const cards = { ...board.cards }
          delete cards[cardId]
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards,
                columns: board.columns.map((c) => ({
                  ...c,
                  cardIds: c.cardIds.filter((id) => id !== cardId),
                })),
              }),
            },
          }
        })
      },

      moveCard: (boardId, cardId, fromColumnId, toColumnId, toIndex) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const columns = board.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }))
          const from = columns.find((c) => c.id === fromColumnId)
          const to = columns.find((c) => c.id === toColumnId)
          if (!from || !to) return s
          const fromIndex = from.cardIds.indexOf(cardId)
          if (fromIndex === -1) return s
          from.cardIds.splice(fromIndex, 1)
          const clampedIndex = Math.max(0, Math.min(toIndex, to.cardIds.length))
          to.cardIds.splice(clampedIndex, 0, cardId)
          return { boards: { ...s.boards, [boardId]: touchBoard({ ...board, columns }) } }
        })
      },

      addSubtask: (boardId, cardId, title) => {
        set((s) => {
          const board = s.boards[boardId]
          const card = board?.cards[cardId]
          if (!board || !card) return s
          const subtask = { id: newId(), title: title.trim() || 'New subtask', completed: false }
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: {
                  ...board.cards,
                  [cardId]: { ...card, subtasks: [...card.subtasks, subtask], updatedAt: now() },
                },
              }),
            },
          }
        })
      },

      toggleSubtask: (boardId, cardId, subtaskId) => {
        set((s) => {
          const board = s.boards[boardId]
          const card = board?.cards[cardId]
          if (!board || !card) return s
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: {
                  ...board.cards,
                  [cardId]: {
                    ...card,
                    subtasks: card.subtasks.map((st) =>
                      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
                    ),
                    updatedAt: now(),
                  },
                },
              }),
            },
          }
        })
      },

      deleteSubtask: (boardId, cardId, subtaskId) => {
        set((s) => {
          const board = s.boards[boardId]
          const card = board?.cards[cardId]
          if (!board || !card) return s
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: {
                  ...board.cards,
                  [cardId]: {
                    ...card,
                    subtasks: card.subtasks.filter((st) => st.id !== subtaskId),
                    updatedAt: now(),
                  },
                },
              }),
            },
          }
        })
      },

      addLabel: (boardId, name, color) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const label: Label = { id: newId(), name: name.trim() || 'Label', color }
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({ ...board, labels: [...board.labels, label] }),
            },
          }
        })
      },

      deleteLabel: (boardId, labelId) => {
        set((s) => {
          const board = s.boards[boardId]
          if (!board) return s
          const cards = Object.fromEntries(
            Object.entries(board.cards).map(([id, card]) => [
              id,
              { ...card, labelIds: card.labelIds.filter((l) => l !== labelId) },
            ]),
          )
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                labels: board.labels.filter((l) => l.id !== labelId),
                cards,
              }),
            },
          }
        })
      },

      toggleCardLabel: (boardId, cardId, labelId) => {
        set((s) => {
          const board = s.boards[boardId]
          const card = board?.cards[cardId]
          if (!board || !card) return s
          const has = card.labelIds.includes(labelId)
          return {
            boards: {
              ...s.boards,
              [boardId]: touchBoard({
                ...board,
                cards: {
                  ...board.cards,
                  [cardId]: {
                    ...card,
                    labelIds: has
                      ? card.labelIds.filter((l) => l !== labelId)
                      : [...card.labelIds, labelId],
                    updatedAt: now(),
                  },
                },
              }),
            },
          }
        })
      },

      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      exportAll: () => ({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: now(),
        boards: get().boards,
        boardOrder: get().boardOrder,
      }),

      importAll: (data) => {
        if (!isValidExport(data)) {
          return { ok: false, error: 'That file is not a recognizable Kanwich export.' }
        }
        if (data.schemaVersion > SCHEMA_VERSION) {
          return {
            ok: false,
            error: `This file was exported by a newer version of Kanwich (schema v${data.schemaVersion}). Please update the app first.`,
          }
        }
        set({ boards: data.boards, boardOrder: data.boardOrder })
        return { ok: true }
      },

      hydrateFromDefaultFile: async () => {
        // Never clobber existing local data — this only seeds a brand-new,
        // empty install (e.g. first load from a local Apache directory).
        if (Object.keys(get().boards).length > 0) return
        try {
          const res = await fetch('./default-board.json')
          if (!res.ok) return
          const data: unknown = await res.json()
          if (isValidExport(data)) {
            set({ boards: data.boards, boardOrder: data.boardOrder })
          }
        } catch {
          // No default-board.json next to index.html — that's the common case.
        }
      },
    }),
    {
      name: 'kanwich-store',
      storage: createJSONStorage(() => idbStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        boards: state.boards,
        boardOrder: state.boardOrder,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
      }),
    },
  ),
)
