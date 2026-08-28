import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { venueConfigById } from '../data'
import type {
  InventoryItem,
  MessageAttachment,
  MessageContext,
  MessageRole,
  PlacedItem,
  Selection,
  WeddingMessage,
  WeddingProfile,
  WeddingWorkspace,
} from '../types'
import { PLATFORM_NAME } from '../config/platform'

type MessagesProps = {
  venueId: string
  profile: WeddingProfile
  selections: Selection[]
  placedItems: PlacedItem[]
  messages: WeddingMessage[]
  setMessages: (next: WeddingMessage[] | ((current: WeddingMessage[]) => WeddingMessage[])) => void
  currentRole: MessageRole
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  onOpenContext: (context: MessageContext) => void
  weddings?: WeddingWorkspace[]
  activeWeddingId?: string
  onSelectWedding?: (id: string) => void
  onOpenPlanning?: () => void
}

const MAX_ATTACHMENT_BYTES = 750_000
const MAX_ATTACHMENTS = 3

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatEventDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function unreadForVenue(wedding: WeddingWorkspace) {
  return wedding.messages.filter((message) => message.senderRole !== 'venue' && !message.readByVenue).length
}

function threadTimestamp(wedding: WeddingWorkspace) {
  const last = wedding.messages[wedding.messages.length - 1]
  return last ? new Date(last.timestamp).getTime() : new Date(`${wedding.profile.date}T12:00:00`).getTime()
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export default function Messages({
  venueId,
  profile,
  selections,
  placedItems,
  messages,
  setMessages,
  currentRole,
  notificationsEnabled,
  setNotificationsEnabled,
  onOpenContext,
  weddings,
  activeWeddingId,
  onSelectWedding,
  onOpenPlanning,
}: MessagesProps) {
  const config = venueConfigById(venueId)
  const venue = config.profile
  const eventLabel = venue.eventLabel ?? 'event'
  const eventPlural = venue.eventPluralLabel ?? 'events'
  const clientLabel = venue.clientLabel ?? 'client'
  const clientDisplay = clientLabel[0].toUpperCase() + clientLabel.slice(1)
  const ownerInbox = currentRole === 'venue' && Boolean(weddings && onSelectWedding)

  const venueInventory = config.inventory
  const venueAreas = config.areas
  const [draft, setDraft] = useState('')
  const [context, setContext] = useState<MessageContext | undefined>(undefined)
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedInventory = useMemo(
    () => selections
      .map((selection) => venueInventory.find((item) => item.id === selection.itemId))
      .filter((item): item is InventoryItem => Boolean(item)),
    [selections, venueInventory],
  )

  const linkedAreas = useMemo(
    () => venueAreas
      .filter((area) => area.plannerEnabled)
      .map((area) => ({ kind: 'area' as const, id: area.id, label: area.name })),
    [venueAreas],
  )

  const ownerThreads = useMemo(() => {
    if (!weddings) return []
    const query = search.trim().toLowerCase()
    return weddings
      .filter((wedding) => !wedding.deletedAt)
      .filter((wedding) => {
        if (!query) return true
        return [
          wedding.profile.couple,
          wedding.profile.primaryEmail,
          wedding.profile.partnerEmail,
        ].some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => threadTimestamp(b) - threadTimestamp(a))
  }, [weddings, search])

  const senderName = currentRole === 'bride' ? (profile.couple || clientDisplay) : `${venue.shortName} Team`
  const otherName = currentRole === 'bride' ? `${venue.shortName} Team` : (profile.couple || clientDisplay)

  const sendMessage = () => {
    if (!draft.trim() && !attachments.length && !context) return
    const message: WeddingMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderRole: currentRole,
      senderName,
      body: draft.trim(),
      timestamp: new Date().toISOString(),
      attachments,
      context,
      readByBride: currentRole === 'bride',
      readByVenue: currentRole === 'venue',
    }
    setMessages((current) => [...current, message])
    setDraft('')
    setAttachments([])
    setContext(undefined)
    setAttachmentError('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      sendMessage()
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    setAttachmentError('')
    const availableSlots = MAX_ATTACHMENTS - attachments.length
    Array.from(files).slice(0, availableSlots).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setAttachmentError('Each message attachment must be under 750 KB.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') return
        setAttachments((current) => current.length >= MAX_ATTACHMENTS ? current : [...current, {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result as string,
        }])
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
      return
    }
    if (typeof Notification === 'undefined') {
      window.alert('This browser does not support browser notifications.')
      return
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') setNotificationsEnabled(true)
    else window.alert(`Notification permission was not granted. Unread messages will still show inside ${PLATFORM_NAME}.`)
  }

  const selectContext = (value: string) => {
    if (!value) {
      setContext(undefined)
      return
    }
    const [kind, id] = value.split('::')
    if (kind === 'area') {
      setContext(linkedAreas.find((item) => item.id === id))
      return
    }
    const item = venueInventory.find((entry) => entry.id === id)
    if (item) setContext({ kind: 'inventory', id: item.id, label: item.name })
  }

  const conversation = (
    <section className="panel conversation-panel conversation-panel--hub">
      <div className="conversation-heading conversation-heading--hub">
        <div className="conversation-avatar" style={{ background: venue.brandPrimary, color: '#fff' }}>{initials(profile.couple)}</div>
        <div className="conversation-heading__copy">
          <strong>{profile.couple || `${eventLabel[0].toUpperCase() + eventLabel.slice(1)} conversation`}</strong>
          <span>{formatEventDate(profile.date)} · {profile.primaryEmail || `${clientDisplay} contact`}</span>
        </div>
        <div className="conversation-heading__actions">
          {ownerInbox && onOpenPlanning && <button className="button button--ghost button--small" onClick={onOpenPlanning}>Open planning workspace</button>}
        </div>
      </div>

      <div className="message-thread message-thread--hub" aria-live="polite">
        {messages.length === 0 && (
          <div className="message-thread-empty">
            <strong>No messages yet.</strong>
            <span>Start the conversation below.</span>
          </div>
        )}

        {messages.map((message) => {
          const mine = message.senderRole === currentRole
          const unreadForMe = !mine && (currentRole === 'bride' ? !message.readByBride : !message.readByVenue)
          return (
            <article className={`message-row ${mine ? 'message-row--mine' : ''}`} key={message.id}>
              <div className={`message-avatar ${message.senderRole === 'venue' ? 'message-avatar--venue' : ''}`}>
                {message.senderRole === 'venue' ? initials(venue.shortName) : initials(profile.couple)}
              </div>
              <div className={`message-bubble ${unreadForMe ? 'message-bubble--unread' : ''}`}>
                <div className="message-meta">
                  <strong>{message.senderName}</strong>
                  <span>{formatMessageTime(message.timestamp)}</span>
                </div>
                {message.body && <p>{message.body}</p>}
                {message.context && (
                  <button className="message-context" onClick={() => onOpenContext(message.context!)}>
                    <span>{message.context.kind === 'inventory' ? '✦' : '⌖'}</span>
                    <div>
                      <small>{message.context.kind === 'inventory' ? 'LINKED RESOURCE' : 'LINKED FLOOR PLAN'}</small>
                      <strong>{message.context.label}</strong>
                    </div>
                    <b>Open →</b>
                  </button>
                )}
                {message.attachments.length > 0 && (
                  <div className="message-attachments">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        className={attachment.mimeType.startsWith('image/') ? 'message-attachment message-attachment--image' : 'message-attachment'}
                        href={attachment.dataUrl}
                        download={attachment.name}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attachment.mimeType.startsWith('image/')
                          ? <img src={attachment.dataUrl} alt={attachment.name} />
                          : <span>📎</span>}
                        <div>
                          <strong>{attachment.name}</strong>
                          <small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="message-composer">
        <div className="composer-context-row">
          <label>
            <span>Link to this message</span>
            <select value={context ? `${context.kind}::${context.id}` : ''} onChange={(event) => selectContext(event.target.value)}>
              <option value="">No linked item</option>
              <optgroup label="Floor plans">
                {linkedAreas.map((item) => <option key={item.id} value={`area::${item.id}`}>{item.label}</option>)}
              </optgroup>
              {selectedInventory.length > 0 && (
                <optgroup label="Selected resources">
                  {selectedInventory.map((item) => <option key={item.id} value={`inventory::${item.id}`}>{item.name}</option>)}
                </optgroup>
              )}
            </select>
          </label>
          <button className="button button--ghost button--small" onClick={() => fileInputRef.current?.click()} disabled={attachments.length >= MAX_ATTACHMENTS}>＋ Photo / file</button>
          <input ref={fileInputRef} className="visually-hidden" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(event) => handleFiles(event.target.files)} />
        </div>

        {attachments.length > 0 && (
          <div className="composer-attachments">
            {attachments.map((attachment) => (
              <button key={attachment.id} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}>
                <span>📎 {attachment.name}</span><b>×</b>
              </button>
            ))}
          </div>
        )}

        {attachmentError && <div className="composer-error">{attachmentError}</div>}
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${otherName}…`} />
        <div className="composer-footer">
          <span>Ctrl + Enter to send</span>
          <button className="button button--primary" onClick={sendMessage} disabled={!draft.trim() && !attachments.length && !context}>Send message</button>
        </div>
      </div>
    </section>
  )

  return (
    <main className="page-main shell messages-page messages-page--hub">
      <section className="page-intro page-intro--split messages-intro messages-intro--hub">
        <div>
          <p className="eyebrow">{venue.shortName.toUpperCase()} · MESSAGES</p>
          <h1>{ownerInbox ? 'Messages' : `Messages with ${venue.shortName}`}</h1>
          {ownerInbox && <p>All client conversations for this venue in one inbox.</p>}
        </div>
        <button className={notificationsEnabled ? 'notification-toggle active' : 'notification-toggle'} onClick={toggleNotifications}>
          <span><b>{notificationsEnabled ? 'On' : 'Off'}</b><small>Browser notifications</small></span><i />
        </button>
      </section>

      {ownerInbox ? (
        <div className="owner-message-hub">
          <aside className="panel owner-thread-list">
            <div className="owner-thread-list__heading">
              <div>
                <span className="mini-label">CONVERSATIONS</span>
                <strong>{ownerThreads.length}</strong>
              </div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${clientLabel}s`} aria-label={`Search ${clientLabel} conversations`} />
            </div>

            <div className="owner-thread-list__items">
              {ownerThreads.map((wedding) => {
                const last = wedding.messages[wedding.messages.length - 1]
                const unread = unreadForVenue(wedding)
                const active = wedding.id === activeWeddingId
                return (
                  <button
                    type="button"
                    key={wedding.id}
                    className={active ? 'owner-thread-item owner-thread-item--active' : 'owner-thread-item'}
                    onClick={() => onSelectWedding?.(wedding.id)}
                  >
                    <span className="owner-thread-item__avatar">{initials(wedding.profile.couple)}</span>
                    <span className="owner-thread-item__body">
                      <span className="owner-thread-item__top">
                        <strong>{wedding.profile.couple}</strong>
                        <small>{last ? formatMessageTime(last.timestamp) : formatEventDate(wedding.profile.date)}</small>
                      </span>
                      <span className="owner-thread-item__preview">
                        {last?.body || (last?.attachments.length ? 'Attachment' : 'No messages yet')}
                      </span>
                      <span className="owner-thread-item__meta">{formatEventDate(wedding.profile.date)}{wedding.status === 'Cancelled' ? ' · Cancelled' : ''}</span>
                    </span>
                    {unread > 0 && <b className="owner-thread-item__unread">{unread}</b>}
                  </button>
                )
              })}
              {ownerThreads.length === 0 && <div className="owner-thread-list__empty">No conversations match your search.</div>}
            </div>
          </aside>

          {conversation}
        </div>
      ) : conversation}
    </main>
  )
}
