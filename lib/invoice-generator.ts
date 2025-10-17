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
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  currency: string;
  currencySymbol: string;
  exchangeRate?: number;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  payments?: Array<{
    method: string;
    amount: number;
    provider?: string;
    createdAt: string;
  }>;
  items: InvoiceItem[];
  convertedPrices?: {
    [key: string]: number;
  };
}

/**
 * Formate un prix avec la devise en préservant les décimales si nécessaires
 */
function formatPrice(price: number, currencySymbol: string): string {
  // Arrondir à 2 décimales maximum
  const roundedPrice = Math.round(price * 100) / 100;
  
  // Si le prix est un nombre entier, ne pas afficher de décimales
  let formattedNumber: string;
  if (roundedPrice % 1 === 0) {
    // Nombre entier : utiliser des espaces pour les milliers
    formattedNumber = roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  } else {
    // Nombre avec décimales : utiliser toLocaleString avec virgule comme séparateur décimal
    formattedNumber = roundedPrice.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace(/\s/g, ' '); // Remplacer les espaces insécables par des espaces normaux
  }
  
  return `${formattedNumber} ${currencySymbol}`;
}

/**
 * Formate une adresse pour l'affichage
 */
function formatAddress(address: any, customerInfo?: any): string[] {
  if (!address || (!address.address && !address.city)) {
    // Si pas d'adresse, utiliser les infos client
    const lines = [];
    if (customerInfo?.name) lines.push(customerInfo.name);
    if (customerInfo?.email) lines.push(customerInfo.email);
    if (customerInfo?.phone) lines.push(`Tél: ${customerInfo.phone}`);
    return lines.length > 0 ? lines : ['Informations non disponibles'];
  }
  
  const lines = [];
  if (address.name) lines.push(address.name);
  if (address.address) lines.push(address.address);
  if (address.city && address.postalCode) {
    lines.push(`${address.postalCode} ${address.city}`);
  } else if (address.city) {
    lines.push(address.city);
  }
  if (address.country) lines.push(address.country);
  if (address.phone) lines.push(address.phone);
  
  return lines;
}

/**
 * Ajoute le logo ou le nom du site dans l'en-tête
 */
function addCompanyHeader(doc: any, margin: number, logoPath?: string) {
  const companyName = 'Boutik\'nakà';
  const subtitle = 'Service proposé par Dinitech';
  
  // Si un logo existe, l'ajouter ici (pour une future implémentation)
  if (logoPath) {
    // TODO: Ajouter l'image du logo
    // doc.addImage(logoPath, 'PNG', margin, 15, 40, 20);
    // Ajuster la position du texte si logo présent
    doc.setFontSize(14);
    doc.setTextColor(220, 20, 60);
    doc.text(companyName, margin + 45, 25);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(subtitle, margin + 45, 30);
  } else {
    // Utiliser le nom du site en grand si pas de logo
    doc.setFontSize(16);
    doc.setTextColor(220, 20, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin, 22);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, margin, 27);
  }
}

/**
 * Récupère le prix converti s'il existe, sinon retourne le prix original
 */
function getConvertedPrice(price: number, invoiceData: InvoiceData): number {
  if (invoiceData.convertedPrices && invoiceData.convertedPrices[price.toString()]) {
    return invoiceData.convertedPrices[price.toString()];
  }
  return price;
}

/**
 * Détermine le type de document selon le statut
 */
function getDocumentType(status: string): string {
  return status === 'QUOTE' ? 'DEVIS' : 'FACTURE';
}

/**
 * Génère un PDF de facture avec les prix convertis
 */
export function generateInvoicePDF(invoiceData: InvoiceData): string {
  try {
    // Créer un nouveau document PDF en français, format A4
    const doc = new jsPDF();
    
    // Dimensions de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Marges réduites pour plus d'espace
  const availableWidth = pageWidth - (2 * margin); // Largeur disponible pour les tableaux
    
    // Formater la date
    const invoiceDate = format(new Date(invoiceData.createdAt), 'dd/MM/yyyy');
    
    // === EN-TÊTE AVEC LOGO ===
    // Ajouter le logo ou le nom du site
    addCompanyHeader(doc, margin);
    
    // Numéro de commande (droite)
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`#${invoiceData.orderNumber}`, pageWidth - margin, 22, { align: 'right' });
    
    // === ADRESSES DYNAMIQUES ===
    let currentY = 40;
    
    // Adresse de facturation (gauche)
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse de facturation', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const billingLines = formatAddress(invoiceData.billingAddress, invoiceData.customer);
    billingLines.forEach((line, index) => {
      // Mettre le nom en gras s'il s'agit de la première ligne et que c'est le nom du client
      if (index === 0 && line === invoiceData.customer.name) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(line, margin, currentY + 8 + (index * 4));
    });
    doc.setFont('helvetica', 'normal');
    
    // Adresse de livraison (droite)
    const rightCol = pageWidth / 2 + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse de livraison', rightCol, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const shippingLines = formatAddress(invoiceData.shippingAddress, invoiceData.customer);
    shippingLines.forEach((line, index) => {
      // Mettre le nom en gras s'il s'agit de la première ligne et que c'est le nom du client
      if (index === 0 && line === invoiceData.customer.name) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(line, rightCol, currentY + 8 + (index * 4));
    });
    doc.setFont('helvetica', 'normal');
    
    // === INFORMATIONS DE COMMANDE ===
    currentY += 35;
    
    // === TABLEAU DES INFORMATIONS DE COMMANDE ===
    const orderInfoData = [
      [invoiceDate, invoiceData.orderNumber, invoiceDate]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Date de facturation', 'Référence de l\'achat', 'Date de commande']],
      body: orderInfoData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
        textColor: [255, 255, 255] as [number, number, number], // Texte blanc
        fontStyle: 'bold' as const,
        fontSize: 8, // Plus compact
        cellPadding: 2, // Plus compact
        halign: 'center' as const
      },
      bodyStyles: {
        fontSize: 7, // Plus compact
        cellPadding: 1.5, // Plus compact
        halign: 'center' as const,
        textColor: [0, 0, 0] as [number, number, number] // Texte noir
      },
      columnStyles: {
        0: { cellWidth: availableWidth / 3 },
        1: { cellWidth: availableWidth / 3 },
        2: { cellWidth: availableWidth / 3 }
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin }
    });
    
    // === TABLEAU PRINCIPAL AVEC ARTICLES ET TOTAUX ===
    currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // === TABLEAU DES ARTICLES ===
    const articlesData = invoiceData.items.map(item => [
      item.name,
      formatPrice(getConvertedPrice(item.unitPrice, invoiceData), invoiceData.currencySymbol),
      item.quantity.toString(),
      formatPrice(getConvertedPrice(item.totalPrice, invoiceData), invoiceData.currencySymbol)
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Article', 'Prix unitaire', 'Qté', 'Total']],
      body: articlesData,
      theme: 'grid',
      headStyles: {
        fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
        textColor: [255, 255, 255] as [number, number, number], // Texte blanc
        fontStyle: 'bold' as const,
        fontSize: 8, // Plus compact
        cellPadding: 2, // Plus compact
        halign: 'center' as const
      },
      bodyStyles: {
        fontSize: 8, // Taille augmentée pour meilleure lisibilité
        cellPadding: 2, // Padding légèrement augmenté
        textColor: [0, 0, 0] as [number, number, number] // Texte noir
      },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.6 }, // 60% pour Article (plus d'espace)
        1: { cellWidth: availableWidth * 0.15, halign: 'right' }, // 15% pour Prix unitaire (réduit)
        2: { cellWidth: availableWidth * 0.1, halign: 'center' }, // 10% pour Qté
        3: { cellWidth: availableWidth * 0.15, halign: 'right' } // 15% pour Total (réduit)
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin }
    });
    
    // === TABLEAU DES TOTAUX ===
    const convertedTotal = getConvertedPrice(invoiceData.total, invoiceData);
    const totalsData = [
      ['Total Articles', formatPrice(convertedTotal, invoiceData.currencySymbol)],
      ['Frais de livraison', 'Gratuit'],
      ['TOTAL', formatPrice(convertedTotal, invoiceData.currencySymbol)]
    ];
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      body: totalsData,
      theme: 'grid',
      bodyStyles: {
        fontSize: 8, // Taille augmentée pour meilleure lisibilité
        cellPadding: 1.5, // Plus compact
        fontStyle: 'bold' as const,
        textColor: [0, 0, 0] as [number, number, number] // Texte noir
      },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.85, halign: 'right' }, // 85% pour Labels (cohérent avec articles)
        1: { cellWidth: availableWidth * 0.15, halign: 'right' } // 15% pour Montants (cohérent avec total articles)
      },
      tableWidth: availableWidth, // Forcer la largeur complète
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Ligne TOTAL en gras et fond gris
        if (data.row.index === totalsData.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9;
        }
      }
    });
    
    // === MOYENS DE PAIEMENT ET MODE DE LIVRAISON (CÔTE À CÔTE) ===
    let finalY = (doc as any).lastAutoTable.finalY + 12;
    
    // Ajouter un petit espace entre les tableaux côte à côte
    const spacing = 6; // Petit espace entre les tableaux
    const tableWidth = (availableWidth - spacing) / 2; // Chaque tableau avec espace
    
    // Styles d'en-tête uniformes et compacts
    const uniformHeaderStyles = {
      fillColor: [128, 128, 128] as [number, number, number], // Fond gris foncé
      textColor: [255, 255, 255] as [number, number, number], // Texte blanc
      fontStyle: 'bold' as const,
      fontSize: 8, // Plus compact
      cellPadding: 2, // Plus compact
      halign: 'center' as const
    };
    
    const uniformBodyStyles = {
      fontSize: 7, // Plus compact
      cellPadding: 1.5, // Plus compact
      textColor: [0, 0, 0] as [number, number, number] // Texte noir
    };
    
    // === TABLEAU MODE DE LIVRAISON (GAUCHE) ===
    const deliveryData = [
      ['Retrait au magasin']
    ];
    
    autoTable(doc, {
      startY: finalY,
      head: [['Mode de livraison']],
      body: deliveryData,
      theme: 'grid',
      headStyles: uniformHeaderStyles,
      bodyStyles: uniformBodyStyles,
      columnStyles: {
        0: { cellWidth: tableWidth } // Largeur exacte
      },
      margin: { left: margin },
      tableWidth: tableWidth, // Forcer la largeur du tableau
      tableLineColor: [0, 0, 0], // Bordures noires
      tableLineWidth: 0.1
    });
    
    // === TABLEAU MOYEN DE PAIEMENT (DROITE) ===
    // Préparer les données des paiements avec dates
    const paymentData = [];
    if (invoiceData.payments && invoiceData.payments.length > 0) {
      invoiceData.payments.forEach(payment => {
        const methodLabel = getPaymentMethodLabel(payment.method);
        const providerInfo = payment.provider ? ` (${payment.provider})` : '';
        const paymentDate = format(new Date(payment.createdAt), 'dd/MM/yyyy');
        paymentData.push([
          `${methodLabel}${providerInfo}`,
          formatPrice(getConvertedPrice(payment.amount, invoiceData), invoiceData.currencySymbol),
          paymentDate
        ]);
      });
    } else {
      paymentData.push(['Non spécifié', '', '']);
    }
    
    autoTable(doc, {
      startY: finalY,
      head: [['Moyen de paiement', 'Montant', 'Date']],
      body: paymentData,
      theme: 'grid',
      headStyles: uniformHeaderStyles,
      bodyStyles: uniformBodyStyles,
      columnStyles: {
        0: { cellWidth: tableWidth * 0.5 }, // 50% pour méthode
        1: { cellWidth: tableWidth * 0.3, halign: 'right' }, // 30% pour montant
        2: { cellWidth: tableWidth * 0.2, halign: 'center' } // 20% pour date
      },
      margin: { left: margin + tableWidth + spacing }, // Avec espace entre les tableaux
      tableWidth: tableWidth, // Forcer la largeur du tableau
      tableLineColor: [0, 0, 0], // Bordures noires
      tableLineWidth: 0.1
    });
    
    // === CONDITIONS ===
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('NB: En acceptant cet achat vous acceptez ces conditions suivantes', margin, finalY);
    
    const conditions = [
      '• La livraison se 2 ou 3 semaines est compté à partir de la réception dans notre entrepôt ou dépôt des fonds à cause des circonstances de transit de colis',
      '• Comme la prix affiché sur la facture est le prix du produit sur le fournisseur et les frais de livraison de France vers Madagascar donc en cas de retour',
      '• le retour Madagascar vers la France sera à la charge du client'
    ];
    
    conditions.forEach((condition, index) => {
      const lines = doc.splitTextToSize(condition, pageWidth - 2 * margin);
      doc.text(lines, margin, finalY + 5 + (index * 8));
      finalY += lines.length * 3;
    });
    
    finalY += 10;
    doc.text('Pour savoir plus sur ces conditions, veuillez visiter le lien: https://www.boutik-naka.com/content/3-conditions-utilisation', margin, finalY);
    
    // === PIED DE PAGE ===
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    const footerText = 'Boutik nakà - Service d\'achat & Marketplace à Madagascar - 102-Lot Lazaret Nord - Croissement Garage Fano - 201 Diego-Suarez - Diégo Suarez - ANTSIRANANA';
    doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    const footerText2 = 'Pour toute assistance / réclamation : contact@boutik-naka.com';
    doc.text(footerText2, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    const footerText3 = 'DINITECH Multi-Services | Services Boutik\'nakà - NIF: 6002203980 | STAT: 45174 71 2019 102041';
    doc.text(footerText3, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Retourner le document au format base64
    return doc.output('datauristring');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Erreur lors de la génération du PDF');
  }
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

// Fonction de traduction des méthodes de paiement
function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'cash':
      return 'Espèce';
    case 'paypal':
      return 'PayPal';
    default:
      return method;
  }
}
