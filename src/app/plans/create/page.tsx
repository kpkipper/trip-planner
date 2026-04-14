import { Suspense } from 'react'
import CreatePlanContent from './create-plan-content'

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <CreatePlanContent />
    </Suspense>
  )
}
