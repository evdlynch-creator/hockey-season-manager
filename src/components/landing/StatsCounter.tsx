import { useEffect, useState } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'

interface StatsCounterProps {
  value: string
  label: string
  delay?: number
}

export function StatsCounter({ value, label, delay = 0 }: StatsCounterProps) {
  const [displayValue, setDisplayValue] = useState("0")
  
  // Extract number and suffix (like + or %)
  const numberValue = parseFloat(value.replace(/[^0-9.]/g, ''))
  const suffix = value.replace(/[0-9.]/g, '')

  useEffect(() => {
    const controls = animate(0, numberValue, {
      duration: 1.8,
      delay: delay + 0.2,
      ease: [0.16, 1, 0.3, 1], // Custom ease out expo
      onUpdate: (latest) => {
        if (value.includes('.')) {
          setDisplayValue(latest.toFixed(1) + suffix)
        } else {
          setDisplayValue(Math.floor(latest) + suffix)
        }
      }
    })
    return () => controls.stop()
  }, [numberValue, suffix, delay, value])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center px-4"
    >
      <div className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-1 font-avega italic">
        {displayValue}
      </div>
      <div className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
        {label}
      </div>
    </motion.div>
  )
}
