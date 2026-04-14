import { Suspense } from 'react'
import PlanViewContent from './plan-view-content'

export default function PlanViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <PlanViewContent />
    </Suspense>
  )
}
