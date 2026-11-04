import { useEffect, useState } from 'react'

// Reveals `fullText` a few characters at a time while `active` is true.
// Swap the interval for real token-by-token chunks once responses stream from the backend.
export function useStreamingText(fullText: string, active: boolean, speed = 18) {
  const [shown, setShown] = useState(active ? '' : fullText)

  useEffect(() => {
    if (!active) return
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += 2
      setShown(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [fullText, active, speed])

  return shown
}
