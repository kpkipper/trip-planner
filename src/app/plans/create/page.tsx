import { Suspense } from 'react'
import { CreateEditContent } from '@/sections/create-edit-content'
import PageLoading from '@/components/page-loading'

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateEditContent />
    </Suspense>
  )
}
