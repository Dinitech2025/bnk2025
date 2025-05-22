import { PriceDisplay } from '@/components/ui/price-display'

// Exemple de services avec prix (à remplacer par des données depuis la base de données)
const mockServices = [
  { id: 1, name: 'Consultation Personnalisée', description: 'Analyse complète de vos besoins et recommandations sur mesure.', price: 99.99, duration: 60 },
  { id: 2, name: 'Installation & Configuration', description: 'Installation professionnelle et configuration optimale de vos équipements.', price: 149.99, duration: 120 },
  { id: 3, name: 'Formation Technique', description: 'Apprenez à utiliser efficacement vos outils avec nos experts.', price: 199.99, duration: 180 },
  { id: 4, name: 'Maintenance Préventive', description: 'Évitez les pannes et optimisez les performances de vos équipements.', price: 79.99, duration: 90 },
  { id: 5, name: 'Assistance à Distance', description: 'Support technique à distance pour résoudre vos problèmes rapidement.', price: 49.99, duration: 45 },
  { id: 6, name: 'Audit de Sécurité', description: 'Analyse complète de la sécurité de vos systèmes informatiques.', price: 299.99, duration: 240 },
]

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nos Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockServices.map((service) => (
          <div key={service.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-primary">Icon</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <div className="flex justify-between items-center mb-4">
              <PriceDisplay 
                price={service.price} 
                size="medium"
              />
              <span className="text-sm text-gray-500">{service.duration} min</span>
            </div>
            <button className="w-full px-4 py-2 bg-primary text-white rounded">
              En savoir plus
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 