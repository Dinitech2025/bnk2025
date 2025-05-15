"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function AddOfferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    profileCount: "",
    maxUsers: "1",
    isPopular: false,
    isActive: true,
    features: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          profileCount: parseInt(formData.profileCount),
          maxUsers: parseInt(formData.maxUsers),
          features: formData.features ? formData.features.split("\n") : []
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'offre");
      }

      toast({
        title: "Succès",
        description: "L'offre a été créée avec succès",
      });

      router.push("/admin/offers");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'offre",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Offre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'offre *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prix (€) *</Label>
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
                <Label htmlFor="duration">Durée (jours) *</Label>
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
                <Label htmlFor="profileCount">Nombre de profils *</Label>
                <Input
                  id="profileCount"
                  name="profileCount"
                  type="number"
                  value={formData.profileCount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Nombre maximum d'utilisateurs</Label>
                <Input
                  id="maxUsers"
                  name="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPopular">Offre populaire</Label>
                  <p className="text-sm text-gray-500">
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

              <div className="space-y-2 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Offre active</Label>
                  <p className="text-sm text-gray-500">
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
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">
                Caractéristiques (une par ligne)
              </Label>
              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={4}
                placeholder="Accès illimité&#10;Support prioritaire&#10;etc..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'offre"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 