import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: string;
}

interface Customer {
  name: string;
  email: string;
}

interface InvoiceData {
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  customer: Customer;
  items: InvoiceItem[];
}

export function generateInvoicePDF(invoiceData: InvoiceData): string {
  // Créer un nouveau document PDF en français, format A4
  const doc = new jsPDF();
  
  // Configuration de la facture
  const companyName = 'Boutik Naka';
  const companyAddress = '123 Rue du Commerce, 75001 Paris';
  const companyPhone = '+33 1 23 45 67 89';
  const companyEmail = 'contact@boutiknaka.com';
  const companyWebsite = 'www.boutiknaka.com';
  const companyLogo = '';  // URL du logo si nécessaire
  
  // Dimensions de la page
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Formater la date
  const invoiceDate = format(new Date(invoiceData.createdAt), 'dd MMMM yyyy', { locale: fr });
  
  // Ajouter l'en-tête de la facture
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURE', pageWidth / 2, margin, { align: 'center' });
  
  // Informations de l'entreprise
  doc.setFontSize(10);
  doc.text(companyName, margin, margin + 10);
  doc.text(companyAddress, margin, margin + 15);
  doc.text(`Tél: ${companyPhone}`, margin, margin + 20);
  doc.text(`Email: ${companyEmail}`, margin, margin + 25);
  doc.text(`Site: ${companyWebsite}`, margin, margin + 30);
  
  // Informations de la facture
  doc.setFontSize(12);
  doc.text(`Facture N°: ${invoiceData.orderNumber}`, pageWidth - margin, margin + 10, { align: 'right' });
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, margin + 20, { align: 'right' });
  doc.text(`Statut: ${getStatusText(invoiceData.status)}`, pageWidth - margin, margin + 30, { align: 'right' });
  
  // Informations du client
  doc.setFontSize(12);
  doc.text('FACTURÉ À:', margin, margin + 50);
  doc.setFontSize(10);
  doc.text(invoiceData.customer.name, margin, margin + 60);
  doc.text(invoiceData.customer.email, margin, margin + 65);
  
  // Préparer les données pour le tableau
  const tableData = invoiceData.items.map(item => [
    item.name,
    getItemTypeText(item.type),
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.totalPrice.toFixed(2)} €`
  ]);
  
  // Ajouter le tableau des articles
  autoTable(doc, {
    startY: margin + 80,
    head: [['Article', 'Type', 'Quantité', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    foot: [
      ['', '', '', 'Total HT', `${(invoiceData.total / 1.2).toFixed(2)} €`],
      ['', '', '', 'TVA (20%)', `${(invoiceData.total - invoiceData.total / 1.2).toFixed(2)} €`],
      ['', '', '', 'Total TTC', `${invoiceData.total.toFixed(2)} €`]
    ],
    footStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold'
    }
  });
  
  // Ajouter des conditions de paiement
  let finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('CONDITIONS DE PAIEMENT', margin, finalY);
  doc.setFontSize(8);
  doc.text('Paiement à réception de la facture. Merci pour votre confiance.', margin, finalY + 5);
  
  // Ajouter un pied de page
  doc.setFontSize(8);
  doc.text(
    `${companyName} - SIRET: 123 456 789 00012 - TVA: FR12 123 456 789`, 
    pageWidth / 2, 
    pageHeight - 10, 
    { align: 'center' }
  );
  
  // Retourner le document au format base64
  return doc.output('dataurlstring');
}

// Fonction de traduction des statuts
function getStatusText(status: string): string {
  switch (status) {
    case 'QUOTE':
      return 'Devis en attente de paiement';
    case 'PENDING':
      return 'En attente';
    case 'PAID':
      return 'Commande payée';
    case 'PROCESSING':
      return 'En traitement';
    case 'SHIPPING':
      return 'En cours de livraison';
    case 'DELIVERED':
      return 'Commande livrée';
    case 'CANCELLED':
      return 'Commande annulée';
    case 'FINISHED':
      return 'Commande terminée';
    default:
      return status;
  }
}

// Fonction de traduction des types d'articles
function getItemTypeText(type: string): string {
  switch (type) {
    case 'PRODUCT':
      return 'Produit';
    case 'SERVICE':
      return 'Service';
    case 'OFFER':
      return 'Abonnement';
    default:
      return type;
  }
} 