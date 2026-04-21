import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  },
)

// Add a request interceptor
apiClient.interceptors.request.use(
  function (response) {
    // Do something before request is sent
    return response
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)
