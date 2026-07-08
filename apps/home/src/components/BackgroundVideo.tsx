import { useEffect, useRef } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4'
const FADE_MS = 500
const REPLAY_DELAY_MS = 100

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = 0
    let fadingOut = false

    const setOpacity = (value: number) => {
      video.style.opacity = String(value)
    }

    const fadeIn = (startTime: number) => {
      const elapsed = performance.now() - startTime
      setOpacity(Math.min(elapsed / FADE_MS, 1))
      if (elapsed < FADE_MS) rafId = requestAnimationFrame(() => fadeIn(startTime))
    }

    const fadeOut = (startTime: number) => {
      const elapsed = performance.now() - startTime
      setOpacity(Math.max(1 - elapsed / FADE_MS, 0))
      if (elapsed < FADE_MS) rafId = requestAnimationFrame(() => fadeOut(startTime))
    }

    const handlePlay = () => {
      fadingOut = false
      cancelAnimationFrame(rafId)
      fadeIn(performance.now())
    }

    const handleTimeUpdate = () => {
      if (fadingOut || !video.duration) return
      const remainingMs = (video.duration - video.currentTime) * 1000
      if (remainingMs <= FADE_MS) {
        fadingOut = true
        cancelAnimationFrame(rafId)
        fadeOut(performance.now() - (FADE_MS - remainingMs))
      }
    }

    const handleEnded = () => {
      cancelAnimationFrame(rafId)
      setOpacity(0)
      setTimeout(() => {
        video.currentTime = 0
        void video.play()
      }, REPLAY_DELAY_MS)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    setOpacity(0)
    void video.play()

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity: 0 }}
      src={VIDEO_URL}
      muted
      playsInline
      autoPlay
      preload="auto"
    />
  )
}
