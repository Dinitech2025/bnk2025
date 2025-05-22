import React from 'react';
import { prisma } from '@/lib/prisma'
import { Plus, Search, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { convertDecimalToNumber } from '@/lib/utils'
import { useCurrency } from '@/lib/hooks/use-currency'
import { PriceWithConversion } from '@/components/ui/currency-selector'
import InventoryClient from './inventory-client'

export const dynamic = 'force-dynamic'

// Récupérer les paramètres de devise depuis la base de données
async function getCurrencySettings() {
  const currencySettings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['currency', 'currencySymbol']
      }
    }
  })
  
  const settings: Record<string, string> = {}
  currencySettings.forEach(setting => {
    settings[setting.key] = setting.value || ''
  })
  
  return {
    currency: settings.currency || 'EUR',
    currencySymbol: settings.currencySymbol || '€'
  }
}

async function getProducts() {
  // Récupérer les produits avec leurs données de base
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      inventory: true,
      price: true,
      images: {
        take: 1,
        select: {
          path: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Pour chaque produit, récupérer les variations avec une requête SQL directe
  const productsWithVariations = await Promise.all(
    products.map(async (product) => {
      const variationsResult = await prisma.$queryRaw`
        SELECT v.*, 
          (
            SELECT json_agg(a.*) 
            FROM "ProductAttribute" a 
            WHERE a."variationId" = v.id
          ) as attributes
        FROM "ProductVariation" v
        WHERE v."productId" = ${product.id}
      `

      const variations = Array.isArray(variationsResult) ? variationsResult : []
      
      return {
        ...product,
        variations: convertDecimalToNumber(variations),
        totalInventory: product.inventory + (
          Array.isArray(variations) 
            ? variations.reduce((sum: number, v: any) => sum + (Number(v.inventory) || 0), 0)
            : 0
        )
      }
    })
  )

  return productsWithVariations
}

export default async function InventoryPage() {
  const [products, currencySettings] = await Promise.all([
    getProducts(),
    getCurrencySettings()
  ])

  return <InventoryClient products={products} currencySettings={currencySettings} />
} 