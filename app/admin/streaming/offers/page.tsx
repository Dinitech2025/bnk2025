"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Tag, Users, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/admin/streaming/offers");
      if (!response.ok) throw new Error("Erreur lors du chargement des offres");
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => 
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Offres</h1>
          <p className="text-muted-foreground">
            Gérez les offres d'abonnement disponibles sur votre plateforme
          </p>
        </div>
        <Button onClick={() => router.push("/admin/streaming/offers/add")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Offre
        </Button>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          type="search"
          placeholder="Rechercher une offre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button type="submit" size="sm" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Profils</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Popularité</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                Chargement...
              </TableCell>
            </TableRow>
          ) : filteredOffers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                {searchTerm ? 
                  "Aucune offre trouvée avec cette recherche" : 
                  "Aucune offre trouvée. Ajoutez votre première offre."
                }
              </TableCell>
            </TableRow>
          ) : (
            filteredOffers.map((offer) => (
              <TableRow 
                key={offer.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/streaming/offers/${offer.id}`)}
              >
                <TableCell className="font-medium">{offer.name}</TableCell>
                <TableCell>{offer.price}€</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    {offer.duration} jour{offer.duration > 1 ? "s" : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-gray-400" />
                    {offer.profileCount}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={offer.isActive ? "default" : "secondary"}>
                    {offer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={offer.isPopular ? "default" : "outline"}>
                    {offer.isPopular ? "Populaire" : "Standard"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/streaming/offers/edit/${offer.id}`);
                    }}
                  >
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 