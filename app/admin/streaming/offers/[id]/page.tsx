"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Tag, Users, Clock, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

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
      const response = await fetch(`/api/admin/streaming/offers/${params.id}`);
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
      const response = await fetch(`/api/admin/streaming/offers/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "L'offre a été supprimée avec succès",
      });

      router.push("/admin/streaming/offers");
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
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!offer) {
    return <div>Offre non trouvée</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={() => router.push("/admin/streaming/offers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Détails de l'offre</h1>
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => router.push(`/admin/streaming/offers/edit/${params.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Détails de base de l'offre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center">
                <Tag className="h-4 w-4 mr-2 text-gray-400" />
                Nom
              </h3>
              <p>{offer.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground">
                {offer.description || "Aucune description"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                Prix
              </h3>
              <p className="text-xl font-bold">{offer.price}€</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Durée
              </h3>
              <p>{offer.duration} jour{offer.duration > 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramètres de l'offre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                Profils
              </h3>
              <p>{offer.profileCount} profil{offer.profileCount > 1 ? "s" : ""} maximum</p>
            </div>
            <div>
              <h3 className="font-semibold">Statut</h3>
              <Badge variant={offer.isActive ? "default" : "secondary"}>
                {offer.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold">Mise en avant</h3>
              <Badge variant={offer.isPopular ? "default" : "outline"}>
                {offer.isPopular ? "Populaire" : "Standard"}
              </Badge>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Créée le {formatDate(offer.createdAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  Dernière mise à jour le {formatDate(offer.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {offer.features && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Caractéristiques</CardTitle>
              <CardDescription>Liste des fonctionnalités incluses</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {JSON.parse(offer.features).map((feature: string, index: number) => (
                  <li key={index} className="text-muted-foreground">{feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 