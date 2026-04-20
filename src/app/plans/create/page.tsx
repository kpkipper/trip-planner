import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { CreateEditContent } from '@/sections/create-edit-content'

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateEditContent />
    </Suspense>
  )
}
