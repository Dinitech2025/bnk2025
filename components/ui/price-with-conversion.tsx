'use client'

'use client'

interface PriceWithConversionProps {
  price: number
  className?: string
}

export function PriceWithConversion({ price, className = '' }: PriceWithConversionProps) {
  return (
    <span className={className}>
      {price.toLocaleString()} Ar
    </span>
  )
}
