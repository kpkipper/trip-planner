export interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  created_at: string
  updated_at: string
}

export type ProfilePatch = Partial<Pick<User, 'username' | 'display_name' | 'bio' | 'avatar_url'>>

export interface GetMeResponse {
  code: string
  message: string
  data: User
}
