'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  click?: boolean
}

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true,
  click = true
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { 
        y: -10, 
        scale: 1.02,
        transition: { duration: 0.3 }
      } : {}}
      whileTap={click ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard