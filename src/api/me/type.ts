export interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  // Absent on older servers; treat as on.
  follow_approval?: boolean
  created_at: string
  updated_at: string
}

export type ProfilePatch = Partial<
  Pick<User, 'username' | 'display_name' | 'bio' | 'avatar_url' | 'follow_approval'>
>

export interface GetMeResponse {
  code: string
  message: string
  data: User
}
