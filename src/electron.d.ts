export {}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true
      exportJson: (
        data: unknown,
        suggestedName: string,
      ) => Promise<{ ok: true; path: string } | { ok: false; canceled?: boolean; error?: string }>
      exportText: (
        content: string,
        suggestedName: string,
        filterName: string,
        extensions: string[],
      ) => Promise<{ ok: true; path: string } | { ok: false; canceled?: boolean; error?: string }>
      importJson: () => Promise<
        { ok: true; data: unknown } | { ok: false; canceled?: boolean; error?: string }
      >
    }
  }
}
