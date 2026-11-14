import type { User } from '@/api/me/type'

export interface LoginResult {
  token: string
  user: User
}

export interface LoginResponse {
  code: string
  message: string
  data: LoginResult
}

export interface EmptyResponse {
  code: string
  message: string
  data?: Record<string, never>
}

export interface LoginMethods {
  email: boolean
  google: boolean
}

export interface LoginMethodsResponse {
  code: string
  message: string
  data: LoginMethods
}
