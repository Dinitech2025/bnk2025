'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, Trash, X, ImagePlus } from 'lucide-react'
import Image from 'next/image'
import ImageCropper from '@/components/ImageCropper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
  variant?: 'avatar' | 'logo'
  isAvatar?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled,
  className = '',
  variant = 'avatar',
  isAvatar = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)

  const effectiveVariant = isAvatar ? 'avatar' : variant

  const containerStyles = effectiveVariant === 'avatar' 
    ? 'h-32 w-32 rounded-full'
    : 'w-full max-w-[300px] h-[150px] rounded-lg'

  const handleUpload = async (file: File) => {
    try {
      if (onUpload) {
        const url = await onUpload(file)
        onChange(url)
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center w-full">
        {value ? (
          <div className={`relative overflow-hidden ${containerStyles}`}>
            <Image
              src={value}
              alt="Image"
              fill
              className={effectiveVariant === 'avatar' ? 'object-cover' : 'object-contain'}
            />
            <Button
              type="button"
              onClick={() => onChange('')}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => document.getElementById('image-upload')?.click()}
            className={`border-dashed ${containerStyles}`}
          >
            <ImagePlus className="h-6 w-6 mr-2" />
            {effectiveVariant === 'avatar' ? 'Ajouter une photo' : 'Ajouter un logo'}
          </Button>
        )}
      </div>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
        }}
      />
    </div>
  )
} 