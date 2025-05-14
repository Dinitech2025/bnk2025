export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nos Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-primary">Icon</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Service {item}</h3>
            <p className="text-gray-600 mb-4">
              Description détaillée du service proposé. Nous offrons une qualité exceptionnelle et une satisfaction garantie.
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded">
              En savoir plus
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 