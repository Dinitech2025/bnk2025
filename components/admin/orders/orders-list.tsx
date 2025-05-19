'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Eye, Search, ChevronUp, ChevronDown, Filter, X, FileText } from 'lucide-react';
import OrderStatusBadge from '@/components/admin/orders/order-status-badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
  productId?: string;
  serviceId?: string;
  offerId?: string;
  product?: { id: string; name: string };
  service?: { id: string; name: string };
  offer?: { id: string; name: string };
}

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  items: OrderItem[];
}

type SortField = "date" | "total" | "status" | "client";
type SortOrder = "asc" | "desc";

export default function OrdersList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Fonction pour changer le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setLoading(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      // Rafraîchir la page pour voir les changements
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
    } finally {
      setLoading(null);
    }
  };

  // Fonction pour générer et afficher la facture
  const generateInvoice = async (orderId: string) => {
    setInvoiceLoading(orderId);
    try {
      // Récupérer les données de la facture
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données de la facture');
      }
      
      const invoiceData = await response.json();
      
      // Importer dynamiquement le générateur de factures
      const { generateInvoicePDF } = await import('@/lib/invoice-generator');
      
      // Générer le PDF
      const pdfDataUrl = generateInvoicePDF(invoiceData);
      
      // Ouvrir le PDF dans un nouvel onglet
      const newWindow = window.open('');
      if (newWindow) {
        newWindow.document.write(`
          <iframe width="100%" height="100%" src="${pdfDataUrl}"></iframe>
        `);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error);
      alert('Erreur lors de la génération de la facture. Veuillez réessayer.');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = 
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === "all" ||
          order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "date":
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case "total":
            comparison = Number(a.total) - Number(b.total);
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
          case "client":
            const aName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`;
            const bName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`;
            comparison = aName.localeCompare(bName);
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [orders, searchTerm, statusFilter, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="QUOTE">Devis en attente de paiement</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="PAID">Commande payée</SelectItem>
                <SelectItem value="PROCESSING">En traitement</SelectItem>
                <SelectItem value="SHIPPING">En cours de livraison</SelectItem>
                <SelectItem value="DELIVERED">Commande livrée</SelectItem>
                <SelectItem value="CANCELLED">Commande annulée</SelectItem>
                <SelectItem value="FINISHED">Commande terminée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("client")}
                >
                  <div className="flex items-center">
                    Client {getSortIcon("client")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date {getSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center">
                    Total {getSortIcon("total")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Statut {getSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrders.length > 0 ? (
                filteredAndSortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber || order.id.substring(0, 8) + '...'}
                    </TableCell>
                    <TableCell>
                      {order.user?.firstName || 'N/A'} {order.user?.lastName || ''}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {Number(order.total).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0 hover:bg-transparent">
                            <OrderStatusBadge status={order.status} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'QUOTE')}
                            disabled={loading === order.id}
                          >
                            Devis en attente de paiement
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PENDING')}
                            disabled={loading === order.id}
                          >
                            En attente
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PAID')}
                            disabled={loading === order.id}
                          >
                            Commande payée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                            disabled={loading === order.id}
                          >
                            En traitement
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'SHIPPING')}
                            disabled={loading === order.id}
                          >
                            En cours de livraison
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            disabled={loading === order.id}
                          >
                            Commande livrée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                            disabled={loading === order.id}
                          >
                            Commande annulée
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'FINISHED')}
                            disabled={loading === order.id}
                          >
                            Commande terminée
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => generateInvoice(order.id)} 
                                disabled={invoiceLoading === order.id}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Aperçu facture</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Voir les détails</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/orders/${order.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Modifier</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/orders/${order.id}/delete`}>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 