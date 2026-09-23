import { Volume2, VolumeX } from 'lucide-react'
import { useKanwichStore } from '../../store/useKanwichStore'
import { playSound } from '../../lib/sound'

export default function SoundToggle() {
  const soundEnabled = useKanwichStore((s) => s.soundEnabled)
  const toggleSound = useKanwichStore((s) => s.toggleSound)

  const handleClick = () => {
    toggleSound()
    playSound('click')
  }

  return (
    <button
      onClick={handleClick}
      aria-label={soundEnabled ? 'Turn off sound effects' : 'Turn on sound effects'}
      title={soundEnabled ? 'Turn off sound effects' : 'Turn on sound effects'}
      className="rounded-md p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  )
}
