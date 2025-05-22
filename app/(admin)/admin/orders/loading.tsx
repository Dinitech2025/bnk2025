import { Loader2 } from 'lucide-react';

export default function OrdersLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
        <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
      
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-gray-600">Chargement des commandes...</span>
      </div>
    </div>
  );
} 