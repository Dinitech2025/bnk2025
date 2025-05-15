'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, AlertCircle, Plus, Pencil, Trash, MapPin, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert2'
import ImageCropper from '@/components/ImageCropper'

interface Address {
  id: string
  type: string
  street: string
  city: string
  state?: string
  zipCode: string
  country: string
  phoneNumber?: string
  isDefault: boolean
}

interface EditClientPageProps {
  params: {
    id: string
  }
}

export default function EditClientPage({ params }: EditClientPageProps) {
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
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressFormData, setAddressFormData] = useState({
    id: '',
    type: 'HOME',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'France',
    phoneNumber: '',
    isDefault: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCropper, setShowCropper] = useState(false)
  const [imageToEdit, setImageToEdit] = useState<string | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/admin/clients/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Client non trouvé')
        }
        
        const data = await response.json()
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          confirmPassword: '',
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
          gender: data.gender || '',
          preferredLanguage: data.preferredLanguage || 'fr',
          newsletter: data.newsletter || false,
          notes: data.notes || '',
          customerType: data.customerType || 'INDIVIDUAL',
          companyName: data.companyName || '',
          vatNumber: data.vatNumber || '',
          image: data.image || '',
        })
        
        if (data.image) {
          setImagePreview(data.image)
        }
        
        // Charger les adresses
        if (data.addresses) {
          setAddresses(data.addresses)
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClient()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setAddressFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setAddressFormData(prev => ({ ...prev, [name]: value }))
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

    // Validation du mot de passe si fourni
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      // Préparer les données à envoyer
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate || undefined,
        gender: formData.gender || undefined,
        preferredLanguage: formData.preferredLanguage,
        newsletter: formData.newsletter,
        notes: formData.notes || undefined,
        customerType: formData.customerType,
        companyName: formData.customerType === 'BUSINESS' ? formData.companyName : undefined,
        vatNumber: formData.customerType === 'BUSINESS' ? formData.vatNumber : undefined,
        image: formData.image || undefined,
        ...(formData.password ? { password: formData.password } : {})
      }

      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue')
      }

      router.push(`/admin/clients/${params.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const handleAddAddress = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de l\'ajout de l\'adresse')
      }

      const newAddress = await response.json()
      setAddresses([...addresses, newAddress])
      resetAddressForm()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    }
  }

  const handleUpdateAddress = async () => {
    if (!editingAddressId) return
    
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/addresses/${editingAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la mise à jour de l\'adresse')
      }

      const updatedAddress = await response.json()
      setAddresses(addresses.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr))
      resetAddressForm()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) return
    
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression de l\'adresse')
      }

      setAddresses(addresses.filter(addr => addr.id !== addressId))
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    }
  }

  const editAddress = (address: Address) => {
    setAddressFormData({
      id: address.id,
      type: address.type,
      street: address.street,
      city: address.city,
      state: address.state || '',
      zipCode: address.zipCode,
      country: address.country,
      phoneNumber: address.phoneNumber || '',
      isDefault: address.isDefault
    })
    setEditingAddressId(address.id)
    setShowAddressForm(true)
  }

  const resetAddressForm = () => {
    setAddressFormData({
      id: '',
      type: 'HOME',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'France',
      phoneNumber: '',
      isDefault: false
    })
    setEditingAddressId(null)
    setShowAddressForm(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>
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
          <Link href={`/admin/clients/${params.id}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Modifier le client</h1>
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
                  Changer la photo
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
              <Label htmlFor="password">
                Nouveau mot de passe <span className="text-sm text-gray-500">(laisser vide pour ne pas modifier)</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1"
                placeholder="••••••••"
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
                disabled={!formData.password}
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
            
            {/* Adresses */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Adresses</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => {
                    resetAddressForm()
                    setShowAddressForm(!showAddressForm)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une adresse
                </Button>
              </div>
              
              {/* Liste des adresses */}
              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">{address.type}</p>
                            <p className="text-sm text-gray-600">{address.street}</p>
                            <p className="text-sm text-gray-600">
                              {address.zipCode} {address.city}, {address.country}
                            </p>
                            {address.phoneNumber && (
                              <p className="text-sm text-gray-600 mt-1">
                                Tél: {address.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => editAddress(address)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {address.isDefault && (
                        <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Adresse par défaut
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-6">Aucune adresse enregistrée</p>
              )}
              
              {/* Formulaire d'ajout/modification d'adresse */}
              {showAddressForm && (
                <div className="border rounded-md p-4 mb-6">
                  <h4 className="font-medium mb-4">
                    {editingAddressId ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressType">Type d'adresse</Label>
                      <select
                        id="addressType"
                        name="type"
                        value={addressFormData.type}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="HOME">Domicile</option>
                        <option value="WORK">Travail</option>
                        <option value="BILLING">Facturation</option>
                        <option value="SHIPPING">Livraison</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="street">Rue</Label>
                      <Input
                        id="street"
                        name="street"
                        value={addressFormData.street}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="123 rue de Paris"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        value={addressFormData.city}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="Paris"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="zipCode">Code postal</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={addressFormData.zipCode}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="75001"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">État/Province</Label>
                      <Input
                        id="state"
                        name="state"
                        value={addressFormData.state}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="Île-de-France"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        name="country"
                        value={addressFormData.country}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="France"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phoneNumber">Téléphone (facultatif)</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={addressFormData.phoneNumber}
                        onChange={handleAddressChange}
                        className="mt-1"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center mt-2">
                        <input
                          id="isDefault"
                          name="isDefault"
                          type="checkbox"
                          checked={addressFormData.isDefault}
                          onChange={handleAddressChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isDefault" className="ml-2">
                          Définir comme adresse par défaut
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetAddressForm}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                    >
                      {editingAddressId ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Link href={`/admin/clients/${params.id}`}>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 