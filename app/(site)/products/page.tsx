'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: ProductImage[];
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/public/products', { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  return res.json()
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error(error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    const existingItem = cart.find((item: any) => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        image: product.images?.[0]?.url,
        currency: 'Ar', // Devise par défaut
        type: 'product'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    
    toast({
      title: "Produit ajouté!",
      description: `${product.name} a été ajouté à votre panier.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nos Produits</h1>
      
      {isLoading ? (
        <p>Chargement des produits...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="relative w-full h-48">
                  <Image
                    src={product.images?.[0]?.url || '/placeholder-image.svg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-2 h-14 overflow-hidden">{product.name}</CardTitle>
                <p className="text-gray-600 text-sm h-20 overflow-hidden">{product.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex justify-between items-center">
                <p className="font-bold text-lg">{Number(product.price).toLocaleString()} Ar</p>
                <Button onClick={() => addToCart(product)}>
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