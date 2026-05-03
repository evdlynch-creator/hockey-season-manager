import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export const MagneticButton = ({ children, className, onClick, ...props }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { height, width, left, top } = ref.current!.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    
    // Max 8px shift
    const x = middleX * 0.1
    const y = middleY * 0.1
    
    const limitedX = Math.max(Math.min(x, 8), -8)
    const limitedY = Math.max(Math.min(y, 8), -8)
    
    setPosition({ x: limitedX, y: limitedY })
  }

  const reset = () => {
    setPosition({ x: 0, y: 0 })
  }

  const { x, y } = position

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={className}
    >
      <motion.div
        animate={{ x, y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    </div>
  )
}
