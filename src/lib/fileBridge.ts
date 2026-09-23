import { downloadJson, downloadTextFile, readJsonFile } from './exportImport'

export function isElectron(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron)
}

/**
 * Saves JSON via Electron's native "Save As" dialog when running as a
 * desktop app, otherwise falls back to a browser `<a download>`.
 */
export async function exportJsonFile(
  data: unknown,
  suggestedName: string,
): Promise<{ ok: boolean; message?: string }> {
  if (isElectron()) {
    const result = await window.electronAPI!.exportJson(data, suggestedName)
    if ('canceled' in result && result.canceled) return { ok: true }
    if (!result.ok) return { ok: false, message: result.error ?? 'Export failed.' }
    return { ok: true, message: `Saved to ${result.path}` }
  }
  downloadJson(data, suggestedName)
  return { ok: true }
}

/**
 * Saves arbitrary text (e.g. the single-board HTML export) via Electron's
 * native "Save As" dialog when running as a desktop app, otherwise falls
 * back to a browser `<a download>`.
 */
export async function exportTextFile(
  content: string,
  suggestedName: string,
  mimeType: string,
  filterName: string,
  extensions: string[],
): Promise<{ ok: boolean; message?: string }> {
  if (isElectron()) {
    const result = await window.electronAPI!.exportText(
      content,
      suggestedName,
      filterName,
      extensions,
    )
    if ('canceled' in result && result.canceled) return { ok: true }
    if (!result.ok) return { ok: false, message: result.error ?? 'Export failed.' }
    return { ok: true, message: `Saved to ${result.path}` }
  }
  downloadTextFile(content, suggestedName, mimeType)
  return { ok: true }
}

/**
 * Opens Electron's native "Open" dialog when running as a desktop app.
 * In the browser, pass a `File` (from an `<input type="file">`) instead.
 */
export async function importJsonFromElectron(): Promise<{
  data?: unknown
  canceled?: boolean
  message?: string
}> {
  const result = await window.electronAPI!.importJson()
  if ('canceled' in result && result.canceled) return { canceled: true }
  if (!result.ok) return { message: result.error ?? 'Import failed.' }
  return { data: result.data }
}

export async function importJsonFromBrowserFile(file: File): Promise<{
  data?: unknown
  message?: string
}> {
  try {
    return { data: await readJsonFile(file) }
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'Import failed.' }
  }
}
