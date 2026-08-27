import { platformConfig, PLATFORM_NAME, PLATFORM_TAGLINE } from '../config/platform'

type LogoProps = {
  compact?: boolean
}

export default function Logo({ compact = false }: LogoProps) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label={PLATFORM_NAME}>
      <svg className="brand__mark" viewBox="0 0 110 78" aria-hidden="true">
        <path
          className="brand__v-left"
          d="M14 10h18l16 48L65 10h15L54 69H42L14 10Z"
        />
        <path
          className="brand__v-right"
          d="M46 10h12l18 41 20-41"
        />
        <path
          className="brand__flourish"
          d="M10 44c16-12 30-21 44-27 13-6 27-10 42-12 10-1 15 1 16 5 1 5-4 9-14 12-12 4-26 8-39 14-14 6-27 13-39 24"
        />
        <path
          className="brand__flourish-tail"
          d="M58 28c10-10 18-19 24-28"
        />
        <path
          className="brand__stem"
          d="M80 18c9 6 16 13 23 20"
        />
        <path className="brand__leaf-outline" d="M80 20c-1-8 2-15 9-20 3 9 0 16-9 20Z" />
        <path className="brand__leaf-outline" d="M87 26c8-1 15 1 21 7-8 4-15 3-21-7Z" />
        <path className="brand__leaf-outline" d="M75 31c-8 0-14 3-19 10 9 2 16-1 19-10Z" />
      </svg>
      {!compact && (
        <div className="brand__words">
          <span className="brand__wordmark" aria-label={PLATFORM_NAME}>
            <span className="brand__wordmark-primary">{platformConfig.wordmarkPrimary}</span>
            <span className="brand__wordmark-accent">{platformConfig.wordmarkAccent}</span>
          </span>
          <span className="brand__submark">{PLATFORM_TAGLINE.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}
