export interface FollowButtonInput {
  is_following: boolean
  follow_requested?: boolean
  follow_approval?: boolean
}

export interface FollowButtonState {
  label: 'Unfollow' | 'Requested' | 'Request to follow' | 'Follow'
  action: 'unfollow' | 'cancel' | 'follow'
}

export const followButton = (p: FollowButtonInput): FollowButtonState => {
  if (p.is_following) return { label: 'Unfollow', action: 'unfollow' }
  if (p.follow_requested) return { label: 'Requested', action: 'cancel' }
  if (p.follow_approval === true) return { label: 'Request to follow', action: 'follow' }
  return { label: 'Follow', action: 'follow' }
}
