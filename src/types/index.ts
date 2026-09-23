export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface CardT {
  id: string
  title: string
  description?: string
  subtasks: Subtask[]
  coverImage?: string
  labelIds: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface ColumnT {
  id: string
  title: string
  cardIds: string[]
}

export interface BoardT {
  id: string
  title: string
  description?: string
  coverImage?: string
  color: string
  columns: ColumnT[]
  cards: Record<string, CardT>
  labels: Label[]
  createdAt: string
  updatedAt: string
}

/** Bumped when the persisted/exported shape changes in a breaking way. */
export const SCHEMA_VERSION = 1

export interface KanwichExport {
  schemaVersion: number
  exportedAt: string
  boards: Record<string, BoardT>
  boardOrder: string[]
}

export const BOARD_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#64748b',
] as const

export const LABEL_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const
