'use client'

import { useCallback, useEffect, useState } from 'react'

import { Copy, Link2, Trash2, UserPlus, X } from 'lucide-react'

import {
  changeRole,
  createInviteLink,
  invite,
  listInviteLinks,
  listMembers,
  removeMember,
  revokeInviteLink,
} from '@/api/members'
import ConfirmDialog from '@/components/confirm-dialog'
import UserAvatar from '@/components/user-avatar'
import { useToast } from '@/contexts/toast-context'
import { copyText } from '@/lib/clipboard'
import { errorSummary } from '@/lib/error-summary'
import { memberControls } from '@/lib/member-controls'
import { memberErrorMessage } from '@/lib/member-errors'
import { buttonClass } from '@/lib/ui-classes'

import type { InviteLink, MemberRole, MemberView } from '@/api/members/type'

interface Props {
  slug: string
  role: string | undefined
  // settings.editors_can_invite from the trip view (members only).
  editorsCanInvite?: boolean
  // Refetch the trip view after a membership change.
  onChanged: () => void
}

const selectClass =
  'rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent'

const expiryLabel = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (d.getTime() <= Date.now()) return 'expired'
  return `expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function MembersPanel({ slug, role, editorsCanInvite, onChanged }: Props) {
  const controls = memberControls(role, editorsCanInvite)
  const { showToast } = useToast()
  const [members, setMembers] = useState<MemberView[]>([])
  const [links, setLinks] = useState<InviteLink[]>([])
  const [username, setUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('traveler')
  const [linkRole, setLinkRole] = useState<MemberRole>('traveler')
  const [busy, setBusy] = useState(false)
  const [newLink, setNewLink] = useState<{ id: string; url: string } | null>(null)
  const [removing, setRemoving] = useState<MemberView | null>(null)

  const fail = useCallback(
    (err: unknown) => {
      showToast(memberErrorMessage(err), 'error')
      console.error('Members request failed:', errorSummary(err))
    },
    [showToast],
  )

  const reloadMembers = useCallback(async () => {
    try {
      setMembers(await listMembers(slug))
    } catch (err) {
      console.error('Failed to load members:', errorSummary(err))
    }
  }, [slug])

  const reloadLinks = useCallback(async () => {
    if (!controls.manageLinks) return
    try {
      setLinks(await listInviteLinks(slug))
    } catch (err) {
      // 403: an editor of a trip that does not let editors invite. Just hide the list.
      setLinks([])
      console.error('Failed to load invite links:', errorSummary(err))
    }
  }, [slug, controls.manageLinks])

  useEffect(() => {
    if (!controls.showPanel) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void reloadMembers()
    void reloadLinks()
  }, [controls.showPanel, reloadMembers, reloadLinks])

  if (!controls.showPanel) return null

  const run = async (action: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await action()
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const effectiveInviteRole: MemberRole = controls.inviteRoles.includes(inviteRole)
    ? inviteRole
    : (controls.inviteRoles[0] ?? 'traveler')
  const effectiveLinkRole: MemberRole = controls.inviteRoles.includes(linkRole)
    ? linkRole
    : (controls.inviteRoles[0] ?? 'traveler')

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const name = username.trim().replace(/^@/, '')
    if (!name) return
    void run(async () => {
      await invite(slug, name, effectiveInviteRole)
      setUsername('')
      showToast(`Invited @${name}`)
      await reloadMembers()
      onChanged()
    })
  }

  const handleRole = (m: MemberView, next: MemberRole) =>
    run(async () => {
      await changeRole(slug, m.username, next)
      await reloadMembers()
      onChanged()
    })

  const handleRemove = () => {
    const m = removing
    setRemoving(null)
    if (!m) return
    void run(async () => {
      await removeMember(slug, m.username)
      await reloadMembers()
      onChanged()
    })
  }

  const handleCreateLink = () =>
    run(async () => {
      const { url, link } = await createInviteLink(slug, effectiveLinkRole)
      // The URL (with its token) is only shown now; it is never stored or logged.
      setNewLink({ id: link.id, url })
      await reloadLinks()
    })

  const handleCopy = async () => {
    if (!newLink) return
    if (await copyText(newLink.url)) showToast('Link copied')
    else showToast('Could not copy. Select the link and copy it manually.', 'error')
  }

  const handleRevoke = (id: string) =>
    run(async () => {
      await revokeInviteLink(slug, id)
      setNewLink((cur) => (cur?.id === id ? null : cur))
      await reloadLinks()
    })

  return (
    <section className="mt-8 rounded-card bg-surface p-5 shadow-soft">
      <ConfirmDialog
        open={removing !== null}
        title="Remove this member?"
        description={`@${removing?.username ?? ''} will lose access to this trip.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />

      <h2 className="mb-3 text-lg font-semibold text-gray-800">Members</h2>

      <ul className="divide-y divide-gray-100">
        {members.map((m) => {
          const isOwner = m.role === 'owner'
          return (
            <li key={m.username} className="flex items-center gap-3 py-2.5">
              <UserAvatar user={m} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {m.display_name || m.username}
                </p>
                <p className="truncate text-xs text-gray-400">@{m.username}</p>
              </div>
              {m.status === 'invited' && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  pending
                </span>
              )}
              {controls.manageMembers && !isOwner ? (
                <>
                  <select
                    aria-label={`Role of @${m.username}`}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) => handleRole(m, e.target.value as MemberRole)}
                    className={selectClass}
                  >
                    <option value="editor">editor</option>
                    <option value="traveler">traveler</option>
                  </select>
                  <button
                    aria-label={`Remove @${m.username}`}
                    disabled={busy}
                    onClick={() => setRemoving(m)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-500">{m.role}</span>
              )}
            </li>
          )
        })}
      </ul>

      {controls.invite && (
        <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Invite by username"
            aria-label="Username to invite"
            autoCapitalize="none"
            autoCorrect="off"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {controls.inviteRoles.length > 1 ? (
            <select
              aria-label="Role to invite as"
              value={effectiveInviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className={selectClass}
            >
              <option value="traveler">traveler</option>
              <option value="editor">editor</option>
            </select>
          ) : (
            <span className="text-xs text-gray-500">as traveler</span>
          )}
          <button
            type="submit"
            disabled={busy || !username.trim()}
            className={buttonClass('primary', 'sm')}
          >
            <UserPlus size={14} />
            Invite
          </button>
        </form>
      )}

      {controls.manageLinks && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Link2 size={14} />
            Invite links
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {controls.inviteRoles.length > 1 ? (
              <select
                aria-label="Role for the new link"
                value={effectiveLinkRole}
                onChange={(e) => setLinkRole(e.target.value as MemberRole)}
                className={selectClass}
              >
                <option value="traveler">traveler</option>
                <option value="editor">editor</option>
              </select>
            ) : (
              <span className="text-xs text-gray-500">traveler link</span>
            )}
            <button
              onClick={handleCreateLink}
              disabled={busy}
              className={buttonClass('secondary', 'sm')}
            >
              Create link
            </button>
          </div>

          {newLink && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2">
              <input
                readOnly
                value={newLink.url}
                aria-label="New invite link"
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-700 shadow-sm hover:bg-gray-100"
              >
                <Copy size={12} />
                Copy
              </button>
            </div>
          )}

          {links.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex-1">
                    {l.role} link
                    <span className="ml-2 text-xs text-gray-400">{expiryLabel(l.expires_at)}</span>
                  </span>
                  {controls.revokeLinks && (
                    <button
                      aria-label={`Revoke ${l.role} link`}
                      disabled={busy}
                      onClick={() => handleRevoke(l.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={12} />
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
