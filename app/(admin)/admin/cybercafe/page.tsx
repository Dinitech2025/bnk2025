"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketType {
  id: string;
  duration: string;
  price: number;
  stock: number;
  usedToday: number;
}

interface DailyReport {
  id: string;
  date: string;
  totalRevenue: number;
  ticketUsages: {
    ticket: {
      duration: string;
      price: number;
    };
    quantity: number;
  }[];
}

export default function CyberCafePage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les tickets
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/cybercafe/tickets')
      .then(res => res.json())
      .then(data => {
        setTickets(data.map((ticket: TicketType) => ({
          ...ticket,
          usedToday: 0
        })));
        setIsLoading(false);
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les tickets",
          variant: "destructive"
        });
        setIsLoading(false);
      });
  }, []);

  // Charger les rapports du mois
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const year = now.getFullYear().toString();

    fetch(`/api/cybercafe/reports?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setMonthlyTotal(data.monthlyTotal || 0);
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de charger les rapports",
          variant: "destructive"
        });
      });
  }, []);

  // Ajouter au stock
  const addToStock = async (ticketId: string, amount: number) => {
    try {
      const res = await fetch('/api/cybercafe/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, amount })
      });

      if (!res.ok) throw new Error();

      const updatedTicket = await res.json();
      setTickets(tickets.map(t => 
        t.id === updatedTicket.id ? { ...t, stock: updatedTicket.stock } : t
      ));

      toast({
        title: "Stock mis à jour",
        description: `Ajout de ${amount} tickets`
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock",
        variant: "destructive"
      });
    }
  };

  // Enregistrer les tickets utilisés
  const recordUsedTickets = (index: number, amount: number) => {
    const ticket = tickets[index];
    
    if (!ticket || amount > ticket.stock) {
      toast({
        title: "Erreur",
        description: `Stock insuffisant. Stock actuel: ${ticket?.stock || 0}`,
        variant: "destructive"
      });
      return;
    }

    const newTickets = [...tickets];
    newTickets[index] = { 
      ...ticket, 
      stock: ticket.stock - amount,
      usedToday: ticket.usedToday + amount
    };
    setTickets(newTickets);
  };

  // Sauvegarder le rapport journalier
  const saveReport = async () => {
    try {
      const ticketUsages = tickets
        .filter(t => t.usedToday > 0)
        .map(t => ({
          ticketId: t.id,
          quantity: t.usedToday
        }));

      if (ticketUsages.length === 0) {
        toast({
          title: "Attention",
          description: "Aucun ticket utilisé aujourd'hui",
          variant: "default"
        });
        return;
      }

      const totalRevenue = tickets.reduce((sum, t) => sum + (t.usedToday * t.price), 0);

      const res = await fetch('/api/cybercafe/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          ticketUsages,
          totalRevenue
        })
      });

      if (!res.ok) throw new Error();

      // Réinitialiser les compteurs
      setTickets(tickets.map(t => ({ ...t, usedToday: 0 })));
      
      // Recharger les rapports
      const now = new Date();
      const month = (now.getMonth() + 1).toString();
      const year = now.getFullYear().toString();
      
      const reportsRes = await fetch(`/api/cybercafe/reports?month=${month}&year=${year}`);
      const reportsData = await reportsRes.json();
      setReports(reportsData.reports || []);
      setMonthlyTotal(reportsData.monthlyTotal || 0);

      toast({
        title: "Rapport sauvegardé",
        description: `Rapport du ${date} enregistré avec succès.`
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le rapport",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion du Cybercafé</h1>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={saveReport}>Enregistrer le Rapport</Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Ajouter Stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter des tickets au stock</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="grid grid-cols-3 items-center gap-4">
                    <Label>{ticket.duration}</Label>
                    <Input
                      type="number"
                      placeholder="Quantité"
                      min="0"
                      id={`stock-${ticket.id}`}
                    />
                    <Button onClick={() => {
                      const input = document.getElementById(`stock-${ticket.id}`) as HTMLInputElement;
                      const value = parseInt(input.value);
                      if (!isNaN(value) && value > 0) {
                        addToStock(ticket.id, value);
                        input.value = '';
                      }
                    }}>Ajouter</Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Nouveau Type de Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau type de ticket</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label>Durée</Label>
                  <select 
                    id="new-ticket-duration"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="30min">30 minutes</option>
                    <option value="1h">1 heure</option>
                    <option value="2h">2 heures</option>
                    <option value="5h">5 heures</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label>Prix</Label>
                  <Input
                    type="number"
                    placeholder="Prix en Ar"
                    min="0"
                    id="new-ticket-price"
                  />
                </div>
                <Button onClick={async () => {
                  const duration = (document.getElementById('new-ticket-duration') as HTMLSelectElement).value;
                  const price = parseInt((document.getElementById('new-ticket-price') as HTMLInputElement).value);
                  
                  if (!duration || isNaN(price)) {
                    toast({
                      title: "Erreur",
                      description: "Veuillez remplir tous les champs correctement",
                      variant: "destructive"
                    });
                    return;
                  }

                  try {
                    const res = await fetch('/api/cybercafe/tickets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ duration, price })
                    });

                    if (!res.ok) throw new Error();

                    const newTicket = await res.json();
                    setTickets([...tickets, { ...newTicket, usedToday: 0 }]);

                    toast({
                      title: "Succès",
                      description: `Nouveau ticket ${duration} créé`
                    });

                    // Réinitialiser les champs
                    (document.getElementById('new-ticket-price') as HTMLInputElement).value = '';
                  } catch {
                    toast({
                      title: "Erreur",
                      description: "Impossible de créer le ticket",
                      variant: "destructive"
                    });
                  }
                }}>Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Utilisation Journalière</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tickets Utilisés Aujourd'hui</h2>
            <div className="grid gap-4">
              {tickets.map((ticket, index) => (
                <div key={ticket.id} className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <Label>Durée: {ticket.duration}</Label>
                    <div className="text-sm text-muted-foreground">Stock: {ticket.stock}</div>
                  </div>
                  <div>
                    <Label>Prix</Label>
                    <Input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => {
                        const newTickets = [...tickets];
                        newTickets[index].price = parseInt(e.target.value) || 0;
                        setTickets(newTickets);
                      }}
                      className="w-32"
                    />
                  </div>
                  <div>
                    <Label>Utiliser</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Quantité"
                        min="0"
                        max={ticket.stock}
                        id={`use-${ticket.id}`}
                      />
                      <Button onClick={() => {
                        const input = document.getElementById(`use-${ticket.id}`) as HTMLInputElement;
                        const value = parseInt(input.value);
                        if (!isNaN(value) && value > 0) {
                          recordUsedTickets(index, value);
                          input.value = '';
                        }
                      }}>Valider</Button>
                    </div>
                  </div>
                  <div>
                    <Label>Utilisés aujourd'hui</Label>
                    <div className="text-xl font-bold">{ticket.usedToday}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Rapports du Mois</h2>
              <div className="text-2xl font-bold">
                Total: {monthlyTotal?.toLocaleString() || 0} Ar
              </div>
            </div>

            <div className="grid gap-4">
              {reports.length === 0 ? (
                <p className="text-muted-foreground">Aucun rapport pour ce mois</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">
                        {new Date(report.date).toLocaleDateString()}
                      </h3>
                      <div className="font-bold">
                        {report.totalRevenue.toLocaleString()} Ar
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {report.ticketUsages.map((usage, i) => (
                        <div key={i}>
                          {usage.ticket.duration}: {usage.quantity} tickets
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
 