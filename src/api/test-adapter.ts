import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

export interface RecordedRequest {
  method?: string
  url?: string
  data: unknown
  headers: Record<string, unknown>
  skipAuthRedirect?: boolean
}

// A fake axios adapter for tests: records each request and answers with `body`.
export const fakeAdapter = (body: unknown, status = 200) => {
  const requests: RecordedRequest[] = []
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    requests.push({
      method: config.method,
      url: config.url,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      headers: { ...config.headers },
      skipAuthRedirect: config.skipAuthRedirect,
    })
    const response = { data: body, status, statusText: '', headers: {}, config }
    if (status >= 400) {
      throw Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        config,
        response,
      })
    }
    return response
  }
  return { adapter, requests }
}
