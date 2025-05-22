import { Suspense } from 'react'
import { AccountsList } from './accounts-list'
import { requireStaff } from '@/lib/auth'

export default async function AccountsPage() {
  // Vérifier que l'utilisateur est admin ou staff
  await requireStaff()

  return (
    <Suspense fallback={<AccountsLoading />}>
      <AccountsList />
    </Suspense>
  )
}

function AccountsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded-md"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
