"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface Offer {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  profileCount: number;
  maxUsers: number;
  isActive: boolean;
  isPopular: boolean;
  features?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OfferDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffer();
  }, [params.id]);

  const fetchOffer = async () => {
    try {
      const response = await fetch(`/api/admin/offers/${params.id}`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'offre");
      const data = await response.json();
      setOffer(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'offre",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/offers/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "L'offre a été supprimée avec succès",
      });

      router.push("/admin/offers");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!offer) {
    return <div>Offre non trouvée</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Détails de l'offre</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/offers/edit/${params.id}`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Modifier
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Cela supprimera définitivement
                  l'offre et toutes les données associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Nom</h3>
              <p>{offer.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Description</h3>
              <p>{offer.description || "Aucune description"}</p>
            </div>
            <div>
              <h3 className="font-semibold">Prix</h3>
              <p>{offer.price}€</p>
            </div>
            <div>
              <h3 className="font-semibold">Durée</h3>
              <p>{offer.duration} jours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Nombre de profils</h3>
              <p>{offer.profileCount}</p>
            </div>
            <div>
              <h3 className="font-semibold">Nombre maximum d'utilisateurs</h3>
              <p>{offer.maxUsers}</p>
            </div>
            <div>
              <h3 className="font-semibold">Statut</h3>
              <p>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    offer.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {offer.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Mise en avant</h3>
              <p>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    offer.isPopular
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {offer.isPopular ? "Populaire" : "Standard"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {offer.features && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Caractéristiques</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {JSON.parse(offer.features).map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 