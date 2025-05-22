'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert2'
import ImageCropper from '@/components/ImageCropper'

export default function NewClientPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '',
    preferredLanguage: 'fr',
    newsletter: false,
    notes: '',
    customerType: 'INDIVIDUAL',
    companyName: '',
    vatNumber: '',
    image: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Créer une URL pour la prévisualisation et ouvrir l'éditeur de rognage
    const previewUrl = URL.createObjectURL(file)
    setImageToEdit(previewUrl)
    setShowCropper(true)
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    setShowCropper(false)
    setImageToEdit(null)
    setImagePreview(croppedImageUrl)
    setUploadingImage(true)
    
    try {
      // Convertir l'URL de données en fichier
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Erreur lors du téléchargement de l\'image')
      }

      // Mettre à jour l'URL de l'image dans le formulaire
      setFormData(prev => ({ ...prev, image: data.url }))
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement de l\'image')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageToEdit(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          birthDate: formData.birthDate || undefined,
          gender: formData.gender || undefined,
          preferredLanguage: formData.preferredLanguage,
          newsletter: formData.newsletter,
          notes: formData.notes || undefined,
          customerType: formData.customerType,
          companyName: formData.customerType === 'BUSINESS' ? formData.companyName : undefined,
          vatNumber: formData.customerType === 'BUSINESS' ? formData.vatNumber : undefined,
          image: formData.image || undefined,
          role: 'CLIENT'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue')
      }

      router.push('/admin/clients')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Afficher le composant de rognage si nécessaire */}
      {showCropper && imageToEdit && (
        <ImageCropper
          imageUrl={imageToEdit}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/admin/clients" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Nouveau client</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo de profil */}
            <div className="md:col-span-2 flex flex-col items-center">
              <Label htmlFor="profileImage" className="mb-2">Photo de profil</Label>
              <div 
                className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
                onClick={handleImageClick}
              >
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt="Photo de profil" 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="profileImage"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="mt-2 flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleImageClick}
                >
                  Ajouter une photo
                </Button>
                {imagePreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Prénom"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Nom"
                  />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1"
                placeholder="email@exemple.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1"
                placeholder="06 12 34 56 78"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Informations supplémentaires */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Informations supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Genre</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Sélectionner</option>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="preferredLanguage">Langue préférée</Label>
                  <select
                    id="preferredLanguage"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>

                <div className="flex items-center mt-6">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="newsletter" className="ml-2">Inscription à la newsletter</Label>
                </div>
              </div>
            </div>

            {/* Type de client */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Type de client</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="customerType">Type</Label>
                  <select
                    id="customerType"
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="INDIVIDUAL">Particulier</option>
                    <option value="BUSINESS">Entreprise</option>
                  </select>
                </div>

                {formData.customerType === 'BUSINESS' && (
                  <>
                    <div>
                      <Label htmlFor="companyName">Nom de l'entreprise</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    <div>
                      <Label htmlFor="vatNumber">Numéro de TVA</Label>
                      <Input
                        id="vatNumber"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="FR12345678900"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Notes additionnelles sur ce client..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/admin/clients">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 