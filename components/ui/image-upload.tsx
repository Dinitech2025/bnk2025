'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, Trash, X, ImagePlus } from 'lucide-react'
import Image from 'next/image'
import ImageCropper from '@/components/ImageCropper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SingleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
  variant?: 'avatar' | 'logo'
  isAvatar?: boolean
  multiple?: false
}

interface MultipleImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
  variant?: 'avatar' | 'logo'
  isAvatar?: boolean
  multiple: true
}

type ImageUploadProps = SingleImageUploadProps | MultipleImageUploadProps

export function ImageUpload(props: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)

  const effectiveVariant = props.isAvatar ? 'avatar' : props.variant

  const containerStyles = effectiveVariant === 'avatar' 
    ? 'h-32 w-32 rounded-full'
    : 'w-full max-w-[300px] h-[150px] rounded-lg'

  const handleUpload = async (file: File) => {
    try {
      if (props.onUpload) {
        const url = await props.onUpload(file)
        if (props.multiple) {
          ;(props as MultipleImageUploadProps).onChange([...(props.value || []), url])
        } else {
          ;(props as SingleImageUploadProps).onChange(url)
        }
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  const handleRemove = (urlToRemove: string) => {
    if (props.multiple) {
      ;(props as MultipleImageUploadProps).onChange((props.value || []).filter(url => url !== urlToRemove))
    } else {
      ;(props as SingleImageUploadProps).onChange('')
    }
  }

  return (
    <div className={`space-y-4 ${props.className}`}>
      <div className="flex items-center gap-4 flex-wrap">
        {props.multiple ? (
          <>
            {(props.value || []).map((url, index) => (
              <div key={index} className={`relative overflow-hidden ${containerStyles}`}>
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className={effectiveVariant === 'avatar' ? 'object-cover' : 'object-contain'}
                />
                <Button
                  type="button"
                  onClick={() => handleRemove(url)}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        ) : (
          <>
            {props.value && (
              <div className={`relative overflow-hidden ${containerStyles}`}>
                <Image
                  src={(props.multiple ? (props.value as string[])[0] : props.value as string)}
                  alt="Image"
                  fill
                  className={effectiveVariant === 'avatar' ? 'object-cover' : 'object-contain'}
                />
                <Button
                  type="button"
                  onClick={() => handleRemove((props.multiple ? (props.value as string[])[0] : props.value as string))}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled}
          onClick={() => document.getElementById('image-upload')?.click()}
          className={`border-dashed ${containerStyles}`}
        >
          <ImagePlus className="h-6 w-6 mr-2" />
          {effectiveVariant === 'avatar' ? 'Ajouter une photo' : 'Ajouter un logo'}
        </Button>
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