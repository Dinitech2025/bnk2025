"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, CreditCard, Clock, Users, Tag } from "lucide-react";

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
}

export default function EditOfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Offer | null>(null);

  useEffect(() => {
    fetchOffer();
  }, [params.id]);

  const fetchOffer = async () => {
    try {
      const response = await fetch(`/api/admin/streaming/offers/${params.id}`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'offre");
      const data = await response.json();
      setFormData({
        ...data,
        features: data.features ? JSON.parse(data.features).join("\n") : ""
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'offre",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/streaming/offers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price.toString()),
          duration: parseInt(formData.duration.toString()),
          profileCount: parseInt(formData.profileCount.toString()),
          maxUsers: parseInt(formData.maxUsers.toString()),
          features: formData.features ? formData.features.split("\n") : []
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification de l'offre");
      }

      toast({
        title: "Succès",
        description: "L'offre a été modifiée avec succès",
      });

      router.push("/admin/streaming/offers");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'offre",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => prev ? ({ ...prev, [name]: checked }) : null);
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push("/admin/streaming/offers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Modifier l'offre</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de l'offre</CardTitle>
            <CardDescription>
              Modifiez les informations de cette offre d'abonnement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-400" />
                    Nom <span className="text-red-500 ml-1">*</span>
                  </span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  <span className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                    Prix (€) <span className="text-red-500 ml-1">*</span>
                  </span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Durée (jours) <span className="text-red-500 ml-1">*</span>
                  </span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileCount">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    Nombre de profils <span className="text-red-500 ml-1">*</span>
                  </span>
                </Label>
                <Input
                  id="profileCount"
                  name="profileCount"
                  type="number"
                  value={formData.profileCount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 flex items-center justify-between md:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isPopular">Offre populaire</Label>
                  <p className="text-sm text-muted-foreground">
                    Mettre en avant cette offre
                  </p>
                </div>
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("isPopular", checked)
                  }
                />
              </div>

              <div className="space-y-2 flex items-center justify-between md:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Offre active</Label>
                  <p className="text-sm text-muted-foreground">
                    L'offre est disponible à la vente
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("isActive", checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Une description claire et concise de l'offre
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Caractéristiques</Label>
              <Textarea
                id="features"
                name="features"
                value={formData.features || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Accès illimité&#10;Support prioritaire&#10;etc..."
              />
              <p className="text-sm text-muted-foreground">
                Une caractéristique par ligne
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/streaming/offers")}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 