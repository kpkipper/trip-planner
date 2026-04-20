import { SearchX } from 'lucide-react'

interface NotFoundProps {
  message?: string
  description?: string
}

export default function NotFound({
  message = 'Trip not found',
  description = "The trip you're looking for doesn't exist or may have been removed.",
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative flex flex-col items-center text-center">
        <div className="absolute w-72 h-72 rounded-full bg-[#edf3f7] blur-3xl opacity-80" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0163a4] to-[#38bdf8] flex items-center justify-center mb-8 shadow-xl shadow-[#0163a4]/20">
            <SearchX size={42} className="text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{message}</h2>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
