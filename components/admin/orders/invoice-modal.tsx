'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrency } from '@/lib/contexts/currency-context'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber?: string
}

export function InvoiceModal({ isOpen, onClose, orderId, orderNumber }: InvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  
  // Récupérer le contexte de devise
  const { targetCurrency, exchangeRates } = useCurrency()

  const generateInvoice = async () => {
    setIsLoading(true)
    try {
      // Préparer les données de conversion si une devise cible est sélectionnée
      const conversionData = targetCurrency ? {
        targetCurrency,
        exchangeRate: exchangeRates[targetCurrency] || 1
      } : null

      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversionData })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données de la facture')
      }
      
      const data = await response.json()
      setInvoiceData(data)
      
      const { generateInvoicePDF } = await import('@/lib/invoice-generator')
      const pdfUrl = generateInvoicePDF(data)
      setPdfDataUrl(pdfUrl)
      
      // Créer un blob URL pour l'affichage dans l'iframe
      try {
        const byteCharacters = atob(pdfUrl.split(',')[1])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        setPdfBlobUrl(blobUrl)
      } catch (error) {
        console.error('Erreur lors de la création du blob URL:', error)
      }
      
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de générer la facture')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = () => {
    if (pdfDataUrl && invoiceData) {
      const link = document.createElement('a')
      link.href = pdfDataUrl
      const documentType = invoiceData.status === 'QUOTE' ? 'Devis' : 'Facture'
      link.download = `${documentType}_${invoiceData.orderNumber || orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const openInNewTab = () => {
    if (pdfDataUrl) {
      const newWindow = window.open('')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${invoiceData?.status === 'QUOTE' ? 'Devis' : 'Facture'} ${invoiceData?.orderNumber}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pdfDataUrl}"></iframe>
            </body>
          </html>
        `)
      }
    }
  }


  // Générer la facture quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen && !pdfDataUrl && !isLoading) {
      generateInvoice()
    }
  }, [isOpen])

  // Nettoyer quand le modal se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setPdfDataUrl(null)
      setInvoiceData(null)
      // Nettoyer le blob URL pour éviter les fuites mémoire
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
        setPdfBlobUrl(null)
      }
    }
  }, [isOpen, pdfBlobUrl])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {invoiceData ? (
                <>
                  {invoiceData.status === 'QUOTE' ? '📄 Devis' : '🧾 Facture'}
                  {orderNumber && ` - ${orderNumber}`}
                </>
              ) : (
                'Génération en cours...'
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {pdfDataUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInNewTab}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Nouvel onglet
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Génération de la facture...</p>
              </div>
            </div>
          ) : pdfBlobUrl ? (
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <iframe
                src={pdfBlobUrl}
                width="100%"
                height="100%"
                className="border-0"
                title={`${invoiceData?.status === 'QUOTE' ? 'Devis' : 'Facture'} ${orderNumber || orderId}`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-muted-foreground">Erreur lors de la génération</p>
                <Button
                  variant="outline"
                  onClick={generateInvoice}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
