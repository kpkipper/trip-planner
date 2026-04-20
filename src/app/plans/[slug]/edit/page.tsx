import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { CreateEditContent } from '@/sections/create-edit-content'

export default async function EditPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateEditContent slug={slug} />
    </Suspense>
  )
}
