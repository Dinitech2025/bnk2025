'use client'

import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
  }, [imgRef, aspectRatio])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio))
  }

  const getCroppedImg = () => {
    setIsLoading(true)
    
    const image = imgRef.current
    const canvas = previewCanvasRef.current
    
    if (!image || !canvas || !completedCrop) {
      setIsLoading(false)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsLoading(false)
      return
    }

    // Définir les dimensions du canvas
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    // Dessiner l'image rognée sur le canvas
    ctx.drawImage(
      image,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    // Convertir le canvas en URL de données
    try {
      const croppedImageUrl = canvas.toDataURL('image/jpeg')
      onCropComplete(croppedImageUrl)
    } catch (e) {
      console.error('Erreur lors de la création de l\'image rognée:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
        <h2 className="text-xl font-semibold mb-4">Rogner l'image</h2>
        
        <div className="flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={aspectRatio === 1}
            className="max-h-[60vh] mx-auto"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Image à rogner"
              onLoad={onImageLoad}
              className="max-h-[60vh] max-w-full"
            />
          </ReactCrop>
          
          {/* Canvas caché pour le rognage */}
          <canvas
            ref={previewCanvasRef}
            className="hidden"
          />
          
          <div className="flex space-x-4 mt-6">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={getCroppedImg}
              disabled={!completedCrop || isLoading}
            >
              {isLoading ? 'Traitement...' : 'Appliquer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 