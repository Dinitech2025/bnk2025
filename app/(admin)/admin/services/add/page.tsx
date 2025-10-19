import { prisma } from '@/lib/prisma'
import { ServiceForm } from '@/components/services/service-form'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Service } from '@prisma/client'
import slugify from 'slugify'

// Force dynamic rendering to avoid useRef SSR issues
export const dynamic = 'force-dynamic'

async function getCategories() {
  return await prisma.serviceCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export default async function AddServicePage() {
  const categories = await getCategories()

  async function onSubmit(data: any) {
    'use server'
    
    const service = await prisma.service.create({
      data: {
        name: data.name,
        slug: slugify(data.name, { lower: true }),
        description: data.description,
        price: parseFloat(data.price),
        duration: parseInt(data.duration),
        categoryId: data.categoryId,
        published: data.published,
        images: {
          create: data.images?.map((image: { path: string }) => ({
            path: image.path
          })) || []
        }
      }
    })

    revalidatePath('/admin/services')
    redirect('/admin/services')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajouter un service</h1>
        <p className="text-sm text-gray-500">
          Créez un nouveau service qui sera disponible sur votre site
        </p>
      </div>
      <ServiceForm
        categories={categories}
        onSubmit={onSubmit}
      />
    </div>
  )
} 