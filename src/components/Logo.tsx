type LogoProps = {
  compact?: boolean
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="ViviaVisions">
      <svg className="brand__mark" viewBox="0 0 74 64" aria-hidden="true">
        <path className="brand__v-left" d="M10 10h13l14 38L52 10h12L40 56h-8L10 10Z" />
        <path className="brand__v-right" d="M29 10h11l14 34 8-18" />
        <path className="brand__flourish" d="M25 36c10-13 22-21 36-24 5-1 8 1 7 5-2 8-14 14-27 18-14 4-27 6-34 4-6-2-4-8 2-12" />
        <path className="brand__stem" d="M55 30c5-7 8-12 10-18" />
        <path className="brand__leaf" d="M58 27c4-1 7-4 9-8-5 0-8 2-9 8Zm3-7c-1-4 0-7 3-10 2 4 1 7-3 10Z" />
      </svg>
      {!compact && (
        <div className="brand__words">
          <span className="brand__wordmark"><span>Vivia</span><span>Visions</span></span>
        </div>
      )}
    </div>
  )
}
