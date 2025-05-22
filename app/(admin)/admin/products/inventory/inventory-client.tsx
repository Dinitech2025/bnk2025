'use client';

import React, { useState } from 'react';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { PriceWithConversion } from '@/components/ui/currency-selector';

interface InventoryClientProps {
  products: any[]; // À typer correctement
  currencySettings: {
    currency: string;
    currencySymbol: string;
  };
}

export default function InventoryClient({ products: initialProducts, currencySettings }: InventoryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState(initialProducts);

  // Filtrer les produits en fonction du terme de recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion du stock</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un produit..."
              className="pl-10 pr-4 py-2 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/admin/products/inventory/adjust">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajuster le stock
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    Stock Total
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3">Détail Stock</th>
                <th className="px-6 py-3">Référence</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.images[0]?.path ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <Image 
                            src={product.images[0].path} 
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">No img</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.variations.length > 0 ? 
                            `${product.variations.length} variation(s)` : 
                            'Pas de variations'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.totalInventory > 10 
                        ? 'bg-green-100 text-green-800'
                        : product.totalInventory > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.totalInventory} en stock
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>{product.inventory} unités (produit)</div>
                      {product.variations.length > 0 && (
                        <div>
                          {product.variations.reduce((sum: number, v: any) => sum + (Number(v.inventory) || 0), 0)} unités (variations)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {product.sku || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <PriceWithConversion price={Number(product.price)} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="space-x-2">
                      <Link 
                        href={`/admin/products/inventory/${product.id}/adjust`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ajuster stock
                      </Link>
                      {product.variations.length > 0 && (
                        <Link 
                          href={`/admin/products/${product.id}/variations`}
                          className="text-indigo-600 hover:text-indigo-900 ml-2"
                        >
                          Variations
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 