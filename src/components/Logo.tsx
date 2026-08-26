type LogoProps = {
  compact?: boolean
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="ViviaVisions">
      <svg className="brand__mark" viewBox="0 0 88 72" aria-hidden="true">
        <path
          className="brand__v-left"
          d="M12 9h16l13 42L55 9h13L47 63h-9L12 9Z"
        />
        <path
          className="brand__v-right"
          d="M39 9h11l15 39L82 9"
        />
        <path
          className="brand__flourish"
          d="M18 44c9-9 17-16 26-21 10-6 21-10 31-11 6-1 9 2 8 6-2 6-9 11-16 15-8 4-17 7-26 10-11 3-20 5-26 4-5-1-4-6 3-10Z"
        />
        <path
          className="brand__flourish-tail"
          d="M47 31c6-8 11-14 15-21"
        />
        <path
          className="brand__leaf"
          d="M61 24c6-1 10-5 13-10-6 0-11 3-13 10Zm6-9c-2-5-1-9 3-13 3 5 2 10-3 13Z"
        />
        <path
          className="brand__leaf brand__leaf--small"
          d="M69 20c5 0 9-3 12-8-5 0-9 2-12 8Z"
        />
      </svg>
      {!compact && (
        <div className="brand__words">
          <span className="brand__wordmark" aria-label="ViviaVisions">
            <span className="brand__wordmark-primary">Vivia</span>
            <span className="brand__wordmark-accent">Visions</span>
          </span>
          <span className="brand__submark">EVERY DETAIL. EVERY OPTION. EVERY VISION.</span>
        </div>
      )}
    </div>
  )
}
