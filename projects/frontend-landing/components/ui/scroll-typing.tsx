"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface ScrollTypingProps {
  text: string
  className?: string
  activeColor?: string
}

const ScrollTyping = ({
  text,
  className = "",
  activeColor = "rgb(46, 86, 252)",
}: ScrollTypingProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const charsRef = useRef<(HTMLSpanElement | null)[]>([])
  const lastVisibleRef = useRef<number>(-1)

  useEffect(() => {
    if (!containerRef.current) return

    const totalChars = text.length

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${totalChars * 80}`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const charIndex = Math.floor(self.progress * totalChars)
        
        // Skip if no change
        if (charIndex === lastVisibleRef.current) return
        
        const prevIndex = lastVisibleRef.current
        lastVisibleRef.current = charIndex

        // Update only changed characters (no React re-render)
        charsRef.current.forEach((el, i) => {
          if (!el) return
          
          const wasVisible = i < prevIndex
          const isVisible = i < charIndex
          const wasLast = i === prevIndex - 1
          const isLast = i === charIndex - 1

          // Only update if state changed
          if (wasVisible !== isVisible) {
            el.style.opacity = isVisible ? "1" : "0"
          }
          
          // Update highlight color
          if (wasLast && !isLast) {
            el.style.color = "inherit"
          }
          if (isLast && !wasLast) {
            el.style.color = activeColor
          }
        })


      },
    })

    return () => {
      trigger.kill()
    }
  }, [text, activeColor])

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen items-center justify-center px-6"
    >
      <div className="relative max-w-5xl text-center">
        <span className={className}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              ref={(el) => { charsRef.current[index] = el }}
              style={{
                opacity: 0,
                transition: "color 0.3s ease",
              }}
            >
              {char}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

export default ScrollTyping
