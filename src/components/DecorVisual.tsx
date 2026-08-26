type DecorVisualProps = {
  styleName: string
  name: string
  large?: boolean
}

export default function DecorVisual({ styleName, name, large = false }: DecorVisualProps) {
  return (
    <div className={`decor-visual decor-visual--${styleName} ${large ? 'decor-visual--large' : ''}`} role="img" aria-label={name}>
      <div className="decor-visual__scene">
        <span className="decor-visual__shape decor-visual__shape--one" />
        <span className="decor-visual__shape decor-visual__shape--two" />
        <span className="decor-visual__shape decor-visual__shape--three" />
      </div>
    </div>
  )
}
