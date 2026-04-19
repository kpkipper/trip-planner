import CircularProgress from '@mui/material/CircularProgress'

export default function PageLoading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <CircularProgress aria-label="Loading…" />
    </div>
  )
}
