import { contextBridge, ipcRenderer } from 'electron'

type ExportResult =
  | { ok: true; path: string }
  | { ok: false; canceled?: boolean; error?: string }

type ImportResult =
  | { ok: true; data: unknown }
  | { ok: false; canceled?: boolean; error?: string }

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true as const,
  exportJson: (data: unknown, suggestedName: string): Promise<ExportResult> =>
    ipcRenderer.invoke('kanwich:export-json', data, suggestedName),
  exportText: (
    content: string,
    suggestedName: string,
    filterName: string,
    extensions: string[],
  ): Promise<ExportResult> =>
    ipcRenderer.invoke('kanwich:export-text', content, suggestedName, filterName, extensions),
  importJson: (): Promise<ImportResult> => ipcRenderer.invoke('kanwich:import-json'),
})
