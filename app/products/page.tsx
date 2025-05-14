export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nos Produits</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm border">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Image</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">Produit {item}</h3>
              <p className="text-gray-600 text-sm mb-2">Description courte du produit</p>
              <div className="flex justify-between items-center">
                <span className="font-bold">€99.99</span>
                <button className="px-3 py-1 bg-primary text-white rounded text-sm">Voir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 