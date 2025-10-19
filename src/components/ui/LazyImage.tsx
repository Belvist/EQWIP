'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  fallback?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

// Оптимизированный компонент для ленивой загрузки изображений
export const LazyImage = ({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  placeholder = "/placeholder-avatar.jpg",
  fallback = "/placeholder-avatar.jpg",
  priority = false,
  onLoad,
  onError
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const imageSrc = hasError ? fallback : isInView ? src : placeholder

  return (
    <motion.div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ width, height }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      )}
    </motion.div>
  )
}

// Компонент для оптимизированной галереи изображений
interface ImageGalleryProps {
  images: string[]
  alt: string
  className?: string
  onImageClick?: (index: number) => void
}

export const ImageGallery = ({
  images,
  alt,
  className = "",
  onImageClick
}: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((src, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
          onClick={() => {
            setSelectedImage(index)
            onImageClick?.(index)
          }}
        >
          <LazyImage
            src={src}
            alt={`${alt} ${index + 1}`}
            width={300}
            height={300}
            className="w-full h-full"
          />
          {index === 0 && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              Главное
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Компонент для аватара с ленивой загрузкой
interface LazyAvatarProps {
  src?: string
  alt: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const LazyAvatar = ({
  src,
  alt,
  fallback = "/placeholder-avatar.jpg",
  size = 'md',
  className = ""
}: LazyAvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      {src ? (
        <LazyImage
          src={src}
          alt={alt}
          width={parseInt(sizeClasses[size].split(' ')[0].replace('w-', ''))}
          height={parseInt(sizeClasses[size].split(' ')[1].replace('h-', ''))}
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {alt.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}