export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contactez-nous</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 font-medium">Nom</label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border rounded-md"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block mb-1 font-medium">Message</label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Votre message..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-md"
            >
              Envoyer
            </button>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Informations de contact</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Adresse</h3>
              <p className="text-gray-600">123 Rue du Commerce, 75001 Paris, France</p>
            </div>
            <div>
              <h3 className="font-medium">Téléphone</h3>
              <p className="text-gray-600">+33 1 23 45 67 89</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-gray-600">contact@boutiknaka.com</p>
            </div>
            <div>
              <h3 className="font-medium">Heures d'ouverture</h3>
              <p className="text-gray-600">Lundi - Vendredi: 9h00 - 18h00</p>
              <p className="text-gray-600">Samedi: 10h00 - 16h00</p>
              <p className="text-gray-600">Dimanche: Fermé</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 