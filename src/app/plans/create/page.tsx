import { Suspense } from 'react'
import CreatePlanContent from './create-plan-content'
import PageLoading from '@/components/page-loading'

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreatePlanContent />
    </Suspense>
  )
}
