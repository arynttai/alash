import { useEffect, useRef } from 'react'

/** Тихий фон (CC‑подобные открытые сэмплы). Громкость по умолчанию очень низкая. */
const AMBIENT_SRC =
  'https://actions.google.com/sounds/v1/weather/wind_soft.ogg'

export default function AmbientScape({ enabled }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.volume = 0.07
    if (enabled) {
      el.play().catch(() => {
        /* автозапуск может быть заблокирован до жеста пользователя */
      })
    } else {
      el.pause()
    }
  }, [enabled])

  return (
    <audio
      ref={ref}
      className="hidden"
      src={AMBIENT_SRC}
      loop
      preload="none"
    />
  )
}
