"use client"

import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  blur?: boolean
  duration?: number
  threshold?: number
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  duration = 0.4, // Fast fade
  threshold = 0.2,
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const startPct = (1 - threshold) * 100

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => setIsVisible(true),
    })

    return () => {
      trigger.kill()
    }
  }, [threshold])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        filter: blur ? (isVisible ? "blur(0px)" : "blur(10px)") : undefined,
        transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out, filter ${duration}s ease-out`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default FadeContent
