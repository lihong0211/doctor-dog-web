import type { CSSProperties } from 'react'
import { Fragment, useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

interface AnimatedParagraphProps {
  text: string
  className?: string
  style?: CSSProperties
}

function AnimatedChar({
  char,
  index,
  totalChars,
  scrollYProgress,
}: {
  char: string
  index: number
  totalChars: number
  scrollYProgress: MotionValue<number>
}) {
  const charProgress = index / totalChars
  const start = Math.max(0, charProgress - 0.1)
  const end = Math.min(1, charProgress + 0.05)
  const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1])
  const display = char === ' ' ? ' ' : char

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ visibility: 'hidden' }}>{display}</span>
      <motion.span style={{ position: 'absolute', left: 0, top: 0, opacity }}>
        {display}
      </motion.span>
    </span>
  )
}

export function AnimatedParagraph({ text, className, style }: AnimatedParagraphProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = text.split('')
  const totalChars = chars.length

  // Group chars into words so line breaks only ever occur between words,
  // not in the middle of one (each AnimatedChar is display:inline-block,
  // which otherwise gives the browser a soft-wrap opportunity after every
  // single letter).
  const words: { char: string; index: number }[][] = []
  let currentWord: { char: string; index: number }[] = []
  chars.forEach((char, index) => {
    if (char === ' ') {
      if (currentWord.length) {
        words.push(currentWord)
        currentWord = []
      }
      words.push([{ char, index }])
    } else {
      currentWord.push({ char, index })
    }
  })
  if (currentWord.length) words.push(currentWord)

  return (
    <p ref={containerRef} className={className} style={style}>
      {words.map((word, wordIndex) => {
        const isSpace = word.length === 1 && word[0].char === ' '
        const renderedChars = word.map(({ char, index }) => (
          <AnimatedChar
            key={index}
            char={char}
            index={index}
            totalChars={totalChars}
            scrollYProgress={scrollYProgress}
          />
        ))
        return isSpace ? (
          <Fragment key={wordIndex}>{renderedChars}</Fragment>
        ) : (
          <span key={wordIndex} style={{ display: 'inline-block' }}>
            {renderedChars}
          </span>
        )
      })}
    </p>
  )
}
