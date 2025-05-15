'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, Trash } from 'lucide-react'
import Image from 'next/image'
import ImageCropper from '@/components/ImageCropper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
  isAvatar?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled,
  className,
  isAvatar = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (isAvatar) {
        // Si c'est un avatar, ouvrir l'éditeur de rognage
        const previewUrl = URL.createObjectURL(file)
        setImageToEdit(previewUrl)
      } else {
        // Si ce n'est pas un avatar, télécharger directement
        setIsUploading(true)
        setError(null)

        if (onUpload) {
          // Si une fonction d'upload est fournie, l'utiliser
          const url = await onUpload(file)
          onChange(url)
        } else {
          // Sinon, utiliser l'API de téléchargement par défaut
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Erreur lors du téléchargement')
          }

          const data = await response.json()
          onChange(data.url)
        }
        setIsUploading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'image')
      console.error('Erreur:', err)
      setIsUploading(false)
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    setImageToEdit(null)
    setIsUploading(true)
    
    try {
      setError(null)

      // Convertir l'URL de données en fichier
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' })

      if (onUpload) {
        // Si une fonction d'upload est fournie, l'utiliser
        const url = await onUpload(file)
        onChange(url)
      } else {
        // Sinon, utiliser l'API de téléchargement par défaut
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement')
        }

        const data = await response.json()
        onChange(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'upload:')
      console.error('Erreur d\'upload:', err)
    } finally {
      setIsUploading(false)
      // Réinitialiser l'input file pour permettre de sélectionner à nouveau le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCropCancel = () => {
    setImageToEdit(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Extraire les initiales pour l'avatar
  const getInitials = () => {
    if (!value) return ''
    const fileName = value.split('/').pop() || ''
    return fileName.substring(0, 2).toUpperCase()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Input
          placeholder="URL de l'image (ou téléchargez une image)"
          value={value || ''}
          onChange={handleUrlChange}
          disabled={disabled || isUploading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || isUploading}
          onClick={handleClick}
        >
          <Upload className="h-4 w-4" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/*"
        disabled={disabled || isUploading}
        className="hidden"
      />

      {isUploading && (
        <div className="text-sm text-muted-foreground">Téléchargement en cours...</div>
      )}

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {value && !isUploading && (
        <>
          {isAvatar ? (
            <div className="flex justify-center">
              <Avatar className="w-32 h-32">
                <AvatarImage src={value} alt="Photo de profil" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border">
              {value.startsWith('http') || value.startsWith('/') ? (
                <Image
                  src={value}
                  alt="Image téléchargée"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Éditeur de rognage d'image pour les avatars uniquement */}
      {imageToEdit && isAvatar && (
        <ImageCropper
          imageUrl={imageToEdit}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  )
} 