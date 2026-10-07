// Emoji flags using country codes
const FLAG_EMOJIS = {
  'FR': '🇫🇷',
  'CI': '🇨🇮',
  'SN': '🇸🇳',
  'CM': '🇨🇲',
  'BE': '🇧🇪',
  'CA': '🇨🇦',
  'MA': '🇲🇦',
  'CH': '🇨🇭',
  'TG': '🇹🇬',
  'BJ': '🇧🇯',
  'BF': '🇧🇫',
  'ML': '🇲🇱'
}

export default function Flag({ code, size = 'md', className = '' }) {
  const emoji = FLAG_EMOJIS[code?.toUpperCase()] || '🏳️'
  
  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }
  
  return (
    <span className={`${sizes[size]} leading-none ${className}`} role="img" aria-label={`Drapeau ${code}`}>
      {emoji}
    </span>
  )
}

export function getFlagEmoji(code) {
  return FLAG_EMOJIS[code?.toUpperCase()] || '🏳️'
}
