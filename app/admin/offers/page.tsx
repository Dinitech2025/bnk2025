"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Offer {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  profileCount: number;
  isActive: boolean;
  isPopular: boolean;
}

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/admin/offers");
      if (!response.ok) throw new Error("Erreur lors du chargement des offres");
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Offres</h1>
        <Button onClick={() => router.push("/admin/offers/add")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Offre
        </Button>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/admin/offers/${offer.id}`)}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{offer.name}</span>
                  {offer.isPopular && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Populaire
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-gray-600">{offer.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{offer.price}€</span>
                    <span className="text-sm text-gray-500">
                      {offer.profileCount} profil{offer.profileCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Durée: {offer.duration} jour{offer.duration > 1 ? "s" : ""}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      offer.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 