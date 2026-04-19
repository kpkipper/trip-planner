import { Suspense } from 'react'
import PlanViewContent from './plan-view-content'
import PageLoading from '@/components/page-loading'

export default function PlanViewPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PlanViewContent />
    </Suspense>
  )
}
