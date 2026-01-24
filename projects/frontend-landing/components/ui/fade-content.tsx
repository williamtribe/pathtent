"use client"

import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  blur?: boolean
  offset?: string // e.g., "top center" or "top 80%"
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  offset = "top 80%",
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(0)
  const [blurValue, setBlurValue] = useState(blur ? 10 : 0)
  const [yOffset, setYOffset] = useState(30)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: offset,
      end: "top 30%",
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress
        setOpacity(progress)
        setYOffset(30 * (1 - progress))
        if (blur) {
          setBlurValue(10 * (1 - progress))
        }
      },
    })

    return () => {
      trigger.kill()
    }
  }, [blur, offset])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity,
        transform: `translateY(${yOffset}px)`,
        filter: blur ? `blur(${blurValue}px)` : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default FadeContent
