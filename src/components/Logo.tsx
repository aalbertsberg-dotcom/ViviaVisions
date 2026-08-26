type LogoProps = {
  compact?: boolean
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="ViviaVisions">
      <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
        <path className="brand__arch" d="M12 52V29C12 15 21 7 32 7s20 8 20 22v23" />
        <path className="brand__v" d="M20 25l12 27 12-27" />
        <path className="brand__leaf" d="M9 22c5-6 9-8 15-10M55 20c-5-6-9-8-15-10" />
      </svg>
      {!compact && (
        <div className="brand__words">
          <span className="brand__venue">Vivia</span>
          <span className="brand__visions">VISIONS</span>
        </div>
      )}
    </div>
  )
}
