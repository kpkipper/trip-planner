import { safeHttpsUrl } from '@/lib/safe-url'

import type { User } from '@/api/me/type'

interface Props {
  user: Pick<User, 'username' | 'display_name' | 'avatar_url'>
  size?: number
}

export default function UserAvatar({ user, size = 32 }: Props) {
  const src = safeHttpsUrl(user.avatar_url)
  const initial = (user.display_name || user.username || '?').charAt(0).toUpperCase()

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export, remote avatar
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover flex-shrink-0 bg-gray-100"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className="rounded-full flex-shrink-0 bg-gradient-to-br from-orange-500 to-pink-500 text-white font-semibold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {initial}
    </span>
  )
}
