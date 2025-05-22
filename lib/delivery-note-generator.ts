import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryNoteData {
  orderNumber: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items: Array<{
    quantity: number;
    product?: {
      name: string;
    };
    service?: {
      name: string;
    };
    offer?: {
      name: string;
    };
  }>;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
}

export function generateDeliveryNotePDF(data: DeliveryNoteData): string {
  try {
    // Créer un nouveau document PDF en français, format A4
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Ajouter autoTable au document
    autoTable(doc, {});
    
    // Configuration de l'entreprise
    const companyName = 'Boutik Naka';
    const companyAddress = '123 Rue du Commerce, 75001 Paris';
    const companyPhone = '+33 1 23 45 67 89';
    const companyEmail = 'contact@boutiknaka.com';
    const companyWebsite = 'www.boutiknaka.com';
    
    // Dimensions de la page
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Formater la date
    const deliveryDate = format(new Date(data.createdAt), 'dd MMMM yyyy', { locale: fr });
    
    // Ajouter l'en-tête
    doc.setFontSize(24);
    doc.text('BON DE LIVRAISON', pageWidth / 2, margin, { align: 'center' });
    
    // Informations de l'entreprise
    doc.setFontSize(10);
    doc.text(companyName, margin, margin + 10);
    doc.text(companyAddress, margin, margin + 15);
    doc.text(`Tél: ${companyPhone}`, margin, margin + 20);
    doc.text(`Email: ${companyEmail}`, margin, margin + 25);
    doc.text(`Site: ${companyWebsite}`, margin, margin + 30);
    
    // Informations du bon de livraison
    doc.setFontSize(12);
    doc.text(`N° Commande: ${data.orderNumber}`, pageWidth - margin, margin + 10, { align: 'right' });
    doc.text(`Date: ${deliveryDate}`, pageWidth - margin, margin + 20, { align: 'right' });
    
    // Informations du client
    doc.setFontSize(12);
    doc.text('DESTINATAIRE:', margin, margin + 50);
    doc.setFontSize(10);
    const clientName = `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
    doc.text(clientName || 'N/A', margin, margin + 60);
    doc.text(data.user.email, margin, margin + 65);

    // Adresse de livraison
    if (data.address) {
      doc.text('Adresse de livraison:', margin, margin + 75);
      doc.text(data.address.street, margin, margin + 80);
      doc.text(`${data.address.zipCode} ${data.address.city}`, margin, margin + 85);
      doc.text(data.address.country, margin, margin + 90);
    }
    
    // Préparer les données pour le tableau
    const tableData = data.items.map(item => [
      item.quantity.toString(),
      item.product?.name || item.service?.name || item.offer?.name || 'N/A',
      'À vérifier',
      ''
    ]);
    
    let finalY = margin + 100;
    
    // Ajouter le tableau des articles
    autoTable(doc, {
      startY: finalY,
      head: [['Quantité', 'Article', 'État', 'Remarques']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 50 }
      },
      didDrawPage: function(data) {
        if (data.cursor) {
          finalY = data.cursor.y;
        }
      }
    });

    // Ajouter la zone de signature
    finalY += 20;
    doc.setFontSize(10);
    doc.text('Signature du livreur:', margin, finalY);
    doc.text('Date et signature du client:', pageWidth - margin - 60, finalY);

    // Ligne pour la signature du livreur
    doc.line(margin, finalY + 20, margin + 60, finalY + 20);
    
    // Ligne pour la signature du client
    doc.line(pageWidth - margin - 60, finalY + 20, pageWidth - margin, finalY + 20);

    // Mentions légales
    doc.setFontSize(8);
    doc.text('Ce document doit être signé par le client à la réception de la marchandise.', margin, pageHeight - margin);
    
    // Retourner le PDF en base64
    return doc.output('datauristring');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Erreur de génération du PDF: ${error.message}`);
    } else {
      throw new Error('Une erreur inattendue est survenue lors de la génération du PDF');
    }
  }
}