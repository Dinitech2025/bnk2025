import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Bienvenue sur BoutikNaka
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Découvrez notre sélection de produits et services de qualité.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/products">
                  <Button className="px-8">Nos produits</Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="px-8">Nos services</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-[400px] w-full bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Image principale</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Catégories populaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Électronique', 'Vêtements', 'Maison', 'Beauté'].map((category) => (
              <div key={category} className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
                <div className="h-24 w-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                  <span className="text-gray-500">Icon</span>
                </div>
                <h3 className="font-medium">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Produits en vedette</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm border">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Image</span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-2">Produit {item}</h3>
                  <p className="text-gray-600 text-sm mb-2">Description courte du produit</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">€99.99</span>
                    <Button size="sm">Voir</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 