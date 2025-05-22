import { PriceDisplay } from '@/components/ui/price-display'

// Exemple de produits avec prix (normalement ces données viendraient de la base de données)
const mockProducts = [
  { id: 1, name: 'Smartphone Premium', description: 'Dernier modèle avec appareil photo haute résolution', price: 899.99, compareAtPrice: 999.99 },
  { id: 2, name: 'Casque Bluetooth', description: 'Son immersif et autonomie de 30 heures', price: 149.99, compareAtPrice: null },
  { id: 3, name: 'Ordinateur Portable', description: 'Léger et puissant pour tous vos besoins', price: 1299.99, compareAtPrice: 1499.99 },
  { id: 4, name: 'Montre Connectée', description: 'Suivez votre activité et vos notifications', price: 249.99, compareAtPrice: 299.99 },
  { id: 5, name: 'Tablette Tactile', description: 'Écran haute résolution et processeur rapide', price: 399.99, compareAtPrice: null },
  { id: 6, name: 'Enceinte Portable', description: 'Son puissant et résistante à l\'eau', price: 79.99, compareAtPrice: 99.99 },
  { id: 7, name: 'Appareil Photo', description: 'Capturez vos moments en haute qualité', price: 599.99, compareAtPrice: 699.99 },
  { id: 8, name: 'Chargeur sans fil', description: 'Rechargez tous vos appareils rapidement', price: 29.99, compareAtPrice: 34.99 },
]

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nos Produits</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm border">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Image</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <PriceDisplay 
                  price={product.price} 
                  comparePrice={product.compareAtPrice}
                  size="medium"
                />
                <button className="px-3 py-1 bg-primary text-white rounded text-sm">Voir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 