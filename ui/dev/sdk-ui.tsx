// A stand-in for the host's shared components, close enough to judge layout.
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Card({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, ...style }} />
}

export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }} />
}

export function Btn({ primary, danger: _danger, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; danger?: boolean }) {
  return (
    <button
      {...rest}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 13,
        cursor: 'pointer',
        border: `1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`,
        background: primary ? 'var(--accent)' : 'transparent',
        color: primary ? 'var(--accent-fg)' : 'var(--text)',
        ...style,
      }}
    />
  )
}

const BADGE: Record<string, CSSProperties> = {
  ok: { background: 'rgba(22, 163, 74, .14)', color: '#15803d' },
  err: { background: 'rgba(220, 38, 38, .14)', color: 'var(--danger)' },
  warn: { background: 'rgba(217, 119, 6, .14)', color: 'var(--warn-text)' },
  aim: { background: 'var(--accent-subtle)', color: 'var(--accent)' },
  muted: { background: 'var(--bg-hover)', color: 'var(--muted)' },
}

export function Badge({ variant, style, ...rest }: HTMLAttributes<HTMLSpanElement> & { variant: string }) {
  return <span {...rest} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 12, ...BADGE[variant], ...style }} />
}

export function Input({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} style={{ padding: '6px 8px', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, ...style }} />
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} />
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px 16px', padding: '8px 24px 12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{actions}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, maxWidth = 640, dismissDisabled, children }: { open: boolean; onClose: () => void; title?: ReactNode; maxWidth?: number; dismissDisabled?: boolean; children?: ReactNode }) {
  if (!open) return null
  const dismiss = () => {
    if (!dismissDisabled) onClose()
  }
  // The host's Modal portals to the body, outside the app's own root, so this one does too.
  return createPortal(
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape') dismiss()
      }}
    >
      <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, .35)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, pointerEvents: 'none' }}>
        <div role="dialog" aria-label={typeof title === 'string' ? title : undefined} style={{ pointerEvents: 'auto', width: '100%', maxWidth, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
            {title}
            <button aria-label="Close" onClick={dismiss} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>
              x
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function SegmentedControl({ segments, value, onChange, ariaLabel }: { segments: { key: string; label: string; tooltip?: string }[]; value: string; onChange: (key: string) => void; ariaLabel?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'inline-flex', gap: 2, padding: 2, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
      {segments.map((segment) => (
        <button
          key={segment.key}
          type="button"
          role="radio"
          aria-checked={segment.key === value}
          title={segment.tooltip ?? segment.label}
          onClick={() => onChange(segment.key)}
          style={{ padding: '6px 10px', border: 0, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: segment.key === value ? 'var(--accent-subtle)' : 'transparent', color: segment.key === value ? 'var(--accent)' : 'var(--muted)' }}
        >
          {segment.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action, testId = 'empty-state' }: { icon: ReactNode; title: ReactNode; subtitle?: ReactNode; action?: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
      <div style={{ fontSize: 40, opacity: 0.12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 320, textAlign: 'center' }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function Skeleton({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} style={{ background: 'var(--bg-hover)', borderRadius: 6, ...style }} />
}

export function ContentSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div data-testid="content-skeleton" style={{ display: 'grid', gap: 8, padding: 12 }}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} style={{ height: 14 }} />
      ))}
    </div>
  )
}
