"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, CreditCard, Clock, Users, Tag, Image as ImageIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/image-upload";

interface Platform {
  id: string;
  name: string;
  logo?: string;
  maxProfilesPerAccount?: number;
}

interface PlatformConfig {
  platformId: string;
  profileCount?: number;
  isDefault?: boolean;
}

interface FormData {
  name: string;
  description: string;
  type: "SINGLE" | "MULTI";
  price: string;
  duration: string;
  durationUnit: string;
  isPopular: boolean;
  isActive: boolean;
  features: string;
  images: string[];
  platformConfigs: PlatformConfig[];
}

type FormField = keyof FormData;

export default function AddOfferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    type: "SINGLE",
    price: "",
    duration: "",
    durationUnit: "DAYS",
    isPopular: false,
    isActive: true,
    features: "",
    images: [],
    platformConfigs: []
  });

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch("/api/admin/streaming/platforms");
      if (!response.ok) throw new Error("Erreur lors du chargement des plateformes");
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les plateformes",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation améliorée des données
      const validationErrors = [];

      if (!formData.name?.trim()) {
        validationErrors.push("Le nom est requis");
      }

      const price = Number(formData.price);
      if (isNaN(price) || price <= 0) {
        validationErrors.push("Le prix doit être un nombre positif");
      }

      const duration = Number(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        validationErrors.push("La durée doit être un nombre positif");
      }

      if (selectedPlatforms.length === 0) {
        validationErrors.push("Veuillez sélectionner au moins une plateforme");
      }

      if (formData.type === "SINGLE" && selectedPlatforms.length > 1) {
        validationErrors.push("Une offre simple ne peut avoir qu'une seule plateforme");
      }

      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          toast({
            title: "Erreur de validation",
            description: error,
            variant: "destructive",
          });
        });
        return;
      }

      // Formatage des données
      const requestData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim(),
        price: Number(formData.price),
        duration: Number(formData.duration),
        features: formData.features
          ? formData.features
              .split("\n")
              .map(f => f.trim())
              .filter(Boolean)
          : [],
        platformConfigs: selectedPlatforms.map(platformId => {
          const config = formData.platformConfigs.find(c => c.platformId === platformId);
          const profileCount = Number(config?.profileCount) || 1;
          return {
            platformId,
            profileCount: isNaN(profileCount) ? 1 : profileCount,
            isDefault: Boolean(config?.isDefault)
          } as PlatformConfig;
        })
      };

      console.log("Données envoyées:", requestData);

      const response = await fetch("/api/admin/streaming/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || "Erreur lors de la création de l'offre");
      }

      toast({
        title: "Succès",
        description: "L'offre a été créée avec succès",
      });

      router.push("/admin/streaming/offers");
    } catch (error: unknown) {
      console.error("Erreur lors de la création:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'offre",
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
    setFormData((prev: FormData) => {
      if (name === "type") {
        return value === "SINGLE" || value === "MULTI"
          ? { ...prev, type: value }
          : prev;
      }
      return { ...prev, [name as FormField]: value };
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const isSelected = prev.includes(platformId);
      if (isSelected) {
        setFormData((prev: FormData) => ({
          ...prev,
          platformConfigs: prev.platformConfigs.filter(config => config.platformId !== platformId)
        }));
        return prev.filter(id => id !== platformId);
      } else {
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) return prev;
        
        const maxProfiles = platform.maxProfilesPerAccount ?? 1;
        setFormData((prev: FormData) => ({
          ...prev,
          platformConfigs: [...prev.platformConfigs, { 
            platformId, 
            profileCount: maxProfiles,
            isDefault: prev.platformConfigs.length === 0 
          }]
        }));
        return [...prev, platformId];
      }
    });
  };

  const handleProfileCountChange = (platformId: string, count: number) => {
    setFormData(prev => ({
      ...prev,
      platformConfigs: prev.platformConfigs.map(config =>
        config.platformId === platformId ? { ...config, profileCount: count } : config
      )
    }));
  };

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
        <h1 className="text-2xl font-bold">Nouvelle offre</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Type d'offre</CardTitle>
              <CardDescription>
                Choisissez le type d'offre et les plateformes incluses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SINGLE" id="single" />
                    <Label htmlFor="single">Offre simple (1 plateforme)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MULTI" id="multi" />
                    <Label htmlFor="multi">Offre multi-plateformes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>Sélectionnez les plateformes</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {platforms.map((platform) => (
                      <div key={platform.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={selectedPlatforms.includes(platform.id)}
                            onCheckedChange={() => handlePlatformSelect(platform.id)}
                            disabled={formData.type === "SINGLE" && selectedPlatforms.length === 1 && !selectedPlatforms.includes(platform.id)}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{platform.name}</span>
                            {selectedPlatforms.includes(platform.id) && (
                              <div className="flex items-center mt-2">
                                <Label className="mr-2">Profils :</Label>
                                <Select
                                  value={formData.platformConfigs.find(config => config.platformId === platform.id)?.profileCount.toString()}
                                  onValueChange={(value) => handleProfileCountChange(platform.id, parseInt(value))}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: platform.maxProfilesPerAccount || 5 }, (_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Détails de base de l'offre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      Durée <span className="text-red-500 ml-1">*</span>
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
                  <Label htmlFor="durationUnit">Unité</Label>
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, durationUnit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAYS">Jours</SelectItem>
                      <SelectItem value="MONTHS">Mois</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="features">Caractéristiques</Label>
                <Textarea
                  id="features"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Une caractéristique par ligne"
                />
              </div>

              <div className="space-y-4">
                <Label>Images de l'offre</Label>
                <ImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                  onRemove={(url) => setFormData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Offre populaire</Label>
                    <p className="text-sm text-muted-foreground">
                      Mettre en avant cette offre
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => handleSwitchChange("isPopular", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Offre active</Label>
                    <p className="text-sm text-muted-foreground">
                      L'offre est disponible à la vente
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/streaming/offers")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading || selectedPlatforms.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer l'offre
          </Button>
        </div>
      </form>
    </div>
  );
} 