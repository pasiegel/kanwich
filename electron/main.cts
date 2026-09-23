import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

// Set only by `npm run electron:dev`, so the window loads the Vite dev
// server (with HMR) instead of the built dist/index.html.
const devServerUrl = process.env.KANWICH_DEV_SERVER_URL || null

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 760,
    minHeight: 500,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Boards are only ever local files/IndexedDB — no reason for the app
  // to navigate to or open arbitrary remote URLs.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = devServerUrl ?? `file://${path.join(__dirname, '../../dist/index.html')}`
    if (!url.startsWith(target.split('#')[0])) event.preventDefault()
  })

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('kanwich:export-json', async (_event, data: unknown, suggestedName: string) => {
  if (!mainWindow) return { ok: false, error: 'No window.' }
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return { ok: false, canceled: true }
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true, path: filePath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
})

ipcMain.handle(
  'kanwich:export-text',
  async (
    _event,
    content: string,
    suggestedName: string,
    filterName: string,
    extensions: string[],
  ) => {
    if (!mainWindow) return { ok: false, error: 'No window.' }
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: suggestedName,
      filters: [{ name: filterName, extensions }],
    })
    if (canceled || !filePath) return { ok: false, canceled: true }
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { ok: true, path: filePath }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  },
)

ipcMain.handle('kanwich:import-json', async () => {
  if (!mainWindow) return { ok: false, error: 'No window.' }
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || filePaths.length === 0) return { ok: false, canceled: true }
  try {
    const content = await fs.readFile(filePaths[0], 'utf-8')
    return { ok: true, data: JSON.parse(content) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
})

void app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
