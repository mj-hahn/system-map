import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import './chrome'

interface TriggerProps {
  ref: RefObject<HTMLButtonElement>
  onClick: () => void
  onKeyDown: (event: KeyboardEvent) => void
  'aria-expanded': boolean
  'aria-haspopup': 'dialog' | 'menu'
}

/** A button that opens a small panel. Esc, a click away or tabbing out closes it. */
export function Dropdown({
  trigger,
  children,
  width,
  align = 'left',
  popup = 'dialog',
  label,
  block = false,
}: {
  trigger: (props: TriggerProps) => ReactNode
  children: (close: () => void) => ReactNode
  width: number
  align?: 'left' | 'right'
  popup?: 'dialog' | 'menu'
  label: string
  block?: boolean
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    button.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  return (
    <span
      ref={root}
      style={{ position: 'relative', display: block ? 'block' : 'inline-flex', minWidth: 0, maxWidth: '100%' }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          close()
        }
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (next && !root.current?.contains(next)) setOpen(false)
      }}
    >
      {trigger({
        ref: button,
        onClick: () => setOpen((value) => !value),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            setOpen(true)
          }
        },
        'aria-expanded': open,
        'aria-haspopup': popup,
      })}
      {open && (
        // The host's main can take focus, so a click on anything here that can't would land
        // there and close this before the click arrives. Focus stops here instead.
        <div
          className="sm-pop"
          tabIndex={-1}
          role={popup === 'dialog' ? 'dialog' : undefined}
          aria-label={popup === 'dialog' ? label : undefined}
          style={{ top: 'calc(100% + 6px)', [align]: 0, width: `min(${width}px, calc(100vw - 24px))` }}
        >
          {children(close)}
        </div>
      )}
    </span>
  )
}

const ITEMS = '[role="menuitem"], [role="menuitemradio"]'

/** Up and Down move between the items of a menu, and the first takes focus as it opens. */
export function MenuList({ label, children }: { label: string; children: ReactNode }) {
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(ITEMS)?.focus()
  }, [])

  const move = (event: KeyboardEvent) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'ArrowDown' ? at + 1 : event.key === 'ArrowUp' ? at - 1 : null
    if (next === null || items.length === 0) return
    event.preventDefault()
    items[(next + items.length) % items.length].focus()
  }

  return (
    <div ref={list} role="menu" aria-label={label} onKeyDown={move}>
      {children}
    </div>
  )
}

export function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
