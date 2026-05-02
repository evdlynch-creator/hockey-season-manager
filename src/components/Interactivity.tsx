import React, { useRef, useState, useEffect } from 'react'
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * MagneticButton: Subtly pulls toward the cursor when hovered.
 */
interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
}

export const MagneticButton = ({ children, className, strength = 40 }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const mouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { width, height, left, top } = ref.current!.getBoundingClientRect()
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    setPosition({ x: x / (width / strength), y: y / (height / strength) })
  }

  const mouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const { x, y } = position

  return (
    <motion.div
      ref={ref}
      onMouseMove={mouseMove}
      onMouseLeave={mouseLeave}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedCounter: Smoothly rolls a number up.
 */
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  format?: (val: number) => string
}

export const AnimatedCounter = ({ 
  value, 
  duration = 1.5, 
  className,
  format = (val) => Math.floor(val).toString() 
}: AnimatedCounterProps) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => format(latest))
  
  useEffect(() => {
    const controls = animate(count, value, { duration, ease: "easeOut" })
    return controls.stop
  }, [value, duration, count])

  return <motion.span className={className}>{rounded}</motion.span>
}

/**
 * Container and Item variants for staggered entrance
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  },
}
