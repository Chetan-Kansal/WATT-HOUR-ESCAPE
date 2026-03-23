'use client'

import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  color?: string
  fontSize?: number
  speed?: number
  opacity?: number
}

export default function MatrixRain({
  color = '#ff0000',
  fontSize = 14,
  speed = 1,
  opacity = 0.15
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const columns = Math.floor(width / fontSize)
    const drops: number[] = new Array(columns).fill(1)

    // Characters: Mix of Katakana, Morse, and Binary
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ01...--- '

    let animationId: number

    const draw = () => {
      // Fade effect for trails
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = color
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i] += speed
      }
      animationId = requestAnimationFrame(draw)
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      // Re-initialize drops on resize to fill new columns
      const newColumns = Math.floor(width / fontSize)
      if (newColumns > drops.length) {
        for (let i = drops.length; i < newColumns; i++) {
          drops[i] = Math.random() * -100 // Stagger new ones
        }
      }
    }

    window.addEventListener('resize', handleResize)
    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [color, fontSize, speed])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  )
}
