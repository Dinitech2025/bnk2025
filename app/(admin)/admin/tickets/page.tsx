import React from 'react';
import { headers } from 'next/headers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TicketsList from '@/components/admin/tickets/tickets-list';
import TicketGenerator from '@/components/admin/tickets/ticket-generator';
import DailyReport from '@/components/admin/tickets/daily-report';
import type { Ticket, TicketBatch, DailyReport as DailyReportType } from '@/app/api/admin/tickets/types';

async function getTickets() {
  const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/tickets', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des tickets');
  }

  return response.json();
}

async function getDailyReport() {
  const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/tickets/daily-report', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du rapport journalier');
  }

  return response.json();
}

export default async function TicketsPage() {
  const [tickets, dailyReport] = await Promise.all([
    getTickets(),
    getDailyReport()
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Tickets Internet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Statistiques rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Recette du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dailyReport.totalRevenue.toLocaleString()} Ar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {dailyReport.ticketsSold.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets restants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {dailyReport.remainingTickets.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets invalides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {dailyReport.invalidTickets.reduce((acc: number, curr: { quantity: number }) => acc + curr.quantity, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList>
          <TabsTrigger value="report">Rapport Journalier</TabsTrigger>
          <TabsTrigger value="tickets">Liste des Tickets</TabsTrigger>
          <TabsTrigger value="generator">Générer des Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <DailyReport report={dailyReport} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsList tickets={tickets} />
        </TabsContent>

        <TabsContent value="generator">
          <TicketGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
 