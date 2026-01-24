"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

interface ScrollTypingProps {
  text: string
  className?: string
  cursorClassName?: string
}

const ScrollTyping = ({ text, className = "", cursorClassName = "" }: ScrollTypingProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  })

  const charCount = useTransform(scrollYProgress, [0, 1], [0, text.length])

  return (
    <div ref={containerRef} className="min-h-[50vh]">
      <div className="sticky top-1/2 -translate-y-1/2">
        <motion.span className={className}>
          <motion.span>
            {text.split("").map((char, index) => (
              <motion.span
                key={index}
                style={{
                  opacity: useTransform(charCount, (count) => (index < count ? 1 : 0)),
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
          <motion.span
            className={`ml-1 inline-block ${cursorClassName}`}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            _
          </motion.span>
        </motion.span>
      </div>
    </div>
  )
}

export default ScrollTyping
