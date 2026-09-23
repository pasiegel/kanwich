import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { useKanwichStore } from './store/useKanwichStore.ts'

// The store persists to IndexedDB asynchronously; only try seeding from a
// local default-board.json once that rehydration has actually finished,
// otherwise an empty-store check here could false-positive and clobber
// data that just hasn't loaded from IndexedDB yet.
function seedFromDefaultFileOnceHydrated() {
  if (useKanwichStore.persist.hasHydrated()) {
    void useKanwichStore.getState().hydrateFromDefaultFile()
  } else {
    useKanwichStore.persist.onFinishHydration(() => {
      void useKanwichStore.getState().hydrateFromDefaultFile()
    })
  }
}
seedFromDefaultFileOnceHydrated()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
