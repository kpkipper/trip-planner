// A loggable one-liner for an error. Never log the error object itself: an AxiosError
// carries the request config, including the Authorization (Bearer) header.
export const errorSummary = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Unknown error'
  const status = (error as { response?: { status?: number } }).response?.status
  return status ? `${error.message} (status ${status})` : error.message
}
