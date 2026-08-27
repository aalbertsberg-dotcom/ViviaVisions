import { useMemo, useRef, useState } from 'react'
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import { venueConfigById } from '../data'
import type { InventoryItem, MessageAttachment, MessageContext, MessageRole, PlacedItem, Selection, WeddingMessage, WeddingProfile } from '../types'
import { PLATFORM_NAME } from '../config/platform'

type MessagesProps = {
  venueId: string
  profile: WeddingProfile
  selections: Selection[]
  placedItems: PlacedItem[]
  messages: WeddingMessage[]
  setMessages: Dispatch<SetStateAction<WeddingMessage[]>>
  currentRole: MessageRole
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  onOpenContext: (context: MessageContext) => void
}

const MAX_ATTACHMENT_BYTES = 750_000
const MAX_ATTACHMENTS = 3

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Messages({ venueId, profile, selections, placedItems, messages, setMessages, currentRole, notificationsEnabled, setNotificationsEnabled, onOpenContext }: MessagesProps) {
  const config = venueConfigById(venueId)
  const venue = config.profile
  const eventLabel = venue.eventLabel ?? 'event'
  const clientLabel = venue.clientLabel ?? 'client'
  const isChandelier = venue.id === 'venue-chandelier-oaks'
  const clientDisplay = clientLabel[0].toUpperCase() + clientLabel.slice(1)
  const roleLabel = (role: MessageRole) => role === 'bride' ? clientDisplay : 'Venue Team'
  const venueInventory = config.inventory
  const venueAreas = config.areas
  const fallbackArea = profile.receptionArea || venueAreas.find((area) => area.kind === 'Reception')?.id || venueAreas[0]?.id || ''
  const fallbackAreaLabel = venueAreas.find((area) => area.id === fallbackArea)?.name || 'Reception area'

  const [draft, setDraft] = useState('')
  const [context, setContext] = useState<MessageContext | undefined>(undefined)
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [simulating, setSimulating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedInventory = useMemo(
    () => selections.map((selection) => venueInventory.find((item) => item.id === selection.itemId)).filter((item): item is InventoryItem => Boolean(item)),
    [selections, venueInventory],
  )
  const linkedAreas = useMemo(() => venueAreas.filter((area) => area.plannerEnabled).map((area) => ({ kind: 'area' as const, id: area.id, label: area.name })), [venueAreas, placedItems.length])

  const senderName = currentRole === 'bride' ? (profile.couple || clientDisplay) : `${venue.shortName} Team`
  const otherRole: MessageRole = currentRole === 'bride' ? 'venue' : 'bride'
  const otherName = otherRole === 'bride' ? (profile.couple || clientDisplay) : `${venue.shortName} Team`

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
    setDraft(''); setAttachments([]); setContext(undefined); setAttachmentError('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); sendMessage() }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    setAttachmentError('')
    const availableSlots = MAX_ATTACHMENTS - attachments.length
    Array.from(files).slice(0, availableSlots).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_BYTES) { setAttachmentError(isChandelier ? 'For the current build, each message attachment must be under 750 KB.' : 'For this browser preview, each message attachment must be under 750 KB.'); return }
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
    if (notificationsEnabled) { setNotificationsEnabled(false); return }
    if (typeof Notification === 'undefined') { window.alert('This browser does not support browser notifications.'); return }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') setNotificationsEnabled(true)
    else window.alert(`Notification permission was not granted. Messages will still show an unread badge in ${PLATFORM_NAME}.`)
  }

  const notify = (body: string) => {
    if (!notificationsEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(`${venue.shortName} · ${PLATFORM_NAME} message`, { body })
  }

  const simulateReply = () => {
    if (simulating) return
    setSimulating(true)
    window.setTimeout(() => {
      const replyBody = otherRole === 'venue'
        ? `Thanks for the update! We have your note. We can use this thread to confirm resources and layout details as the ${eventLabel} gets closer.`
        : `That works for us. I linked the layout so we can keep the ${eventLabel} setup discussion together.`
      const reply: WeddingMessage = {
        id: `msg-preview-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderRole: otherRole,
        senderName: otherName,
        body: replyBody,
        timestamp: new Date().toISOString(),
        attachments: [],
        context: { kind: 'area', id: fallbackArea, label: fallbackAreaLabel },
        readByBride: otherRole === 'bride',
        readByVenue: otherRole === 'venue',
      }
      setMessages((current) => [...current, reply]); notify(`${otherName}: ${replyBody}`); setSimulating(false)
    }, 900)
  }

  const selectContext = (value: string) => {
    if (!value) { setContext(undefined); return }
    const [kind, id] = value.split('::')
    if (kind === 'area') { setContext(linkedAreas.find((item) => item.id === id)); return }
    const item = venueInventory.find((entry) => entry.id === id)
    if (item) setContext({ kind: 'inventory', id: item.id, label: item.name })
  }

  return (
    <main className="page-main shell messages-page">
      <section className="page-intro page-intro--split messages-intro">
        <div>
          <p className="eyebrow">{venue.shortName.toUpperCase()} · {eventLabel.toUpperCase()} MESSAGES</p>
          <h1>Keep the conversation with the plan.</h1>
          <p>Questions, confirmations, photos and linked resources stay attached to this {eventLabel} instead of getting scattered across texts and email.</p>
        </div>
        <div className="message-demo-role message-demo-role--locked">
          <span className="mini-label">SIGNED IN AS</span>
          <strong>{currentRole === 'venue' ? `${venue.shortName} Team` : profile.couple}</strong>
          <small>Your role follows the venue-owner or {clientLabel} access used to enter this workspace.</small>
        </div>
      </section>

      <div className="messages-layout">
        <section className="panel conversation-panel">
          <div className="conversation-heading">
            <div className="conversation-avatar" style={{ background: venue.brandPrimary, color: '#fff' }}>{venue.logoText}</div>
            <div><strong>{profile.couple || `${eventLabel[0].toUpperCase() + eventLabel.slice(1)} conversation`}</strong><span>{venue.shortName} · {eventLabel[0].toUpperCase() + eventLabel.slice(1)} planning thread</span></div>
            <div className="conversation-status"><span className="status-dot" /> Active</div>
          </div>

          <div className="message-thread" aria-live="polite">
            {messages.map((message) => {
              const mine = message.senderRole === currentRole
              const unreadForMe = !mine && (currentRole === 'bride' ? !message.readByBride : !message.readByVenue)
              return (
                <article className={`message-row ${mine ? 'message-row--mine' : ''}`} key={message.id}>
                  <div className={`message-avatar ${message.senderRole === 'venue' ? 'message-avatar--venue' : ''}`}>{message.senderRole === 'venue' ? 'V' : clientDisplay[0]}</div>
                  <div className={`message-bubble ${unreadForMe ? 'message-bubble--unread' : ''}`}>
                    <div className="message-meta"><strong>{message.senderName}</strong><span>{roleLabel(message.senderRole)} · {formatMessageTime(message.timestamp)}</span></div>
                    {message.body && <p>{message.body}</p>}
                    {message.context && <button className="message-context" onClick={() => onOpenContext(message.context!)}><span>{message.context.kind === 'inventory' ? '✦' : '⌖'}</span><div><small>{message.context.kind === 'inventory' ? 'LINKED RESOURCE' : 'LINKED FLOOR PLAN'}</small><strong>{message.context.label}</strong></div><b>Open →</b></button>}
                    {message.attachments.length > 0 && <div className="message-attachments">{message.attachments.map((attachment) => <a key={attachment.id} className={attachment.mimeType.startsWith('image/') ? 'message-attachment message-attachment--image' : 'message-attachment'} href={attachment.dataUrl} download={attachment.name} target="_blank" rel="noreferrer">{attachment.mimeType.startsWith('image/') ? <img src={attachment.dataUrl} alt={attachment.name} /> : <span>📎</span>}<div><strong>{attachment.name}</strong><small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small></div></a>)}</div>}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="message-composer">
            <div className="composer-context-row">
              <label><span>Link to this message</span><select value={context ? `${context.kind}::${context.id}` : ''} onChange={(e) => selectContext(e.target.value)}><option value="">No linked item</option><optgroup label="Floor plan">{linkedAreas.map((item) => <option key={item.id} value={`area::${item.id}`}>{item.label}</option>)}</optgroup>{selectedInventory.length > 0 && <optgroup label="Selected resources">{selectedInventory.map((item) => <option key={item.id} value={`inventory::${item.id}`}>{item.name}</option>)}</optgroup>}</select></label>
              <button className="button button--ghost button--small" onClick={() => fileInputRef.current?.click()} disabled={attachments.length >= MAX_ATTACHMENTS}>＋ Photo / file</button>
              <input ref={fileInputRef} className="visually-hidden" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => handleFiles(e.target.files)} />
            </div>
            {attachments.length > 0 && <div className="composer-attachments">{attachments.map((attachment) => <button key={attachment.id} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}><span>📎 {attachment.name}</span><b>×</b></button>)}</div>}
            {attachmentError && <div className="composer-error">{attachmentError}</div>}
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${otherName}…`} />
            <div className="composer-footer"><span>Ctrl + Enter to send · {isChandelier ? 'Stored in this browser for the current build' : 'Stored only in this browser preview'}</span><button className="button button--primary" onClick={sendMessage} disabled={!draft.trim() && !attachments.length && !context}>Send message</button></div>
          </div>
        </section>

        <aside className="message-sidebar">
          <section className="panel notification-card">
            <p className="eyebrow">NOTIFICATIONS</p><h2>Don't miss a reply.</h2><p>Unread messages are always shown in the navigation. Browser notifications can also pop up when a reply arrives.</p>
            <button className={notificationsEnabled ? 'notification-toggle active' : 'notification-toggle'} onClick={toggleNotifications}><span><b>{notificationsEnabled ? 'On' : 'Off'}</b><small>Browser notifications</small></span><i /></button>
            <button className="button button--ghost full-width" onClick={simulateReply} disabled={simulating}>{simulating ? (isChandelier ? 'Sending test reply…' : 'Waiting for preview reply…') : (isChandelier ? `Test reply from ${otherName}` : `Simulate reply from ${otherName}`)}</button>
            <small className="prototype-help">{isChandelier ? 'Temporary notification test until the live messaging backend is connected.' : 'This simulation exists so the preview can show notifications without a live messaging backend.'}</small>
          </section>
          <section className="panel message-info-card"><p className="eyebrow">THREAD DETAILS</p><h2>{profile.couple || eventLabel[0].toUpperCase() + eventLabel.slice(1)}</h2><dl><div><dt>Venue</dt><dd>{venue.shortName}</dd></div><div><dt>{eventLabel[0].toUpperCase() + eventLabel.slice(1)} date</dt><dd>{profile.date ? new Date(`${profile.date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}</dd></div><div><dt>Messages</dt><dd>{messages.length}</dd></div><div><dt>Selected resources</dt><dd>{selections.reduce((sum, item) => sum + item.quantity, 0)} pieces</dd></div><div><dt>Floor plan</dt><dd>{placedItems.length ? `${placedItems.length} objects placed` : 'Not started'}</dd></div></dl></section>
        </aside>
      </div>
    </main>
  )
}
