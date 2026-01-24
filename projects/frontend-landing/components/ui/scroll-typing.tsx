"use client"

import { useRef, useEffect, useState } from "react"
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
  activeColor = "rgb(46, 86, 252)", // primary color
}: ScrollTypingProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [visibleChars, setVisibleChars] = useState(0)
  const [activeCharIndex, setActiveCharIndex] = useState(-1)

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return

    const totalChars = text.length

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${totalChars * 100}`, // 100px per character = slow scroll
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress
        const charIndex = Math.floor(progress * totalChars)
        setVisibleChars(charIndex)
        setActiveCharIndex(charIndex - 1)
      },
    })

    return () => {
      trigger.kill()
    }
  }, [text])

  return (
    <div ref={containerRef} className="flex min-h-screen items-center justify-center px-6">
      <div ref={textRef} className="max-w-5xl text-center">
        <span className={className}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              style={{
                opacity: index < visibleChars ? 1 : 0,
                color: index === activeCharIndex ? activeColor : "inherit",
                transition: "color 0.3s ease",
              }}
            >
              {char}
            </span>
          ))}
          <span
            className="ml-1 inline-block text-primary"
            style={{
              opacity: visibleChars < text.length ? 1 : 0,
              animation: "blink 1s infinite",
            }}
          >
            _
          </span>
        </span>
      </div>
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default ScrollTyping
