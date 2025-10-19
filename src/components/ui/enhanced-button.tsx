'use client'

import { motion } from 'framer-motion'
import { Button, ButtonProps } from '@/components/ui/button'
import { ReactNode } from 'react'

interface EnhancedButtonProps extends ButtonProps {
  children: ReactNode
  ripple?: boolean
  glow?: boolean
}

const EnhancedButton = ({ 
  children, 
  ripple = true,
  glow = false,
  className = '',
  ...props 
}: EnhancedButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const button = e.currentTarget
      const ripple = document.createElement('span')
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      
      ripple.style.width = ripple.style.height = size + 'px'
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      ripple.classList.add('ripple')
      
      button.appendChild(ripple)
      
      setTimeout(() => {
        ripple.remove()
      }, 600)
    }
    
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${glow ? 'group' : ''}`}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-500 dark:from-gray-600 dark:to-gray-800 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition duration-300"></div>
      )}
      
      <Button
        {...props}
        onClick={handleClick}
        className={`
          relative overflow-hidden 
          transition-all duration-300 
          hover:shadow-lg
          ${ripple ? 'ripple-container' : ''}
          ${className}
        `}
      >
        {children}
      </Button>
    </motion.div>
  )
}

export default EnhancedButton