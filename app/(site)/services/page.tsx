'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Clock } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'

interface ServiceImage {
  url: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  images: ServiceImage[];
}

async function getServices(): Promise<Service[]> {
  const res = await fetch('/api/public/services', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch services')
  }
  return res.json()
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices()
        setServices(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les services.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [])

  const addToCart = (service: Service) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    const existingItem = cart.find((item: any) => item.id === service.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ 
        id: service.id, 
        name: service.name, 
        price: service.price, 
        quantity: 1, 
        image: service.images?.[0]?.url,
        currency: 'Ar',
        type: 'service'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    toast({
      title: "Service ajouté!",
      description: `${service.name} a été ajouté à votre panier.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nos Services</h1>
      
      {isLoading ? (
        <p>Chargement des services...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="relative w-full h-48">
                  <Image
                    src={service.images?.[0]?.url || '/placeholder-image.svg'}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-2 h-14 overflow-hidden">{service.name}</CardTitle>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{service.duration} minutes</span>
                </div>
                <p className="text-gray-600 text-sm h-20 overflow-hidden">{service.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex justify-between items-center">
                <p className="font-bold text-lg">{Number(service.price).toLocaleString()} Ar</p>
                <Button onClick={() => addToCart(service)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 