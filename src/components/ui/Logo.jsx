// Logo component using the favicon.svg
export default function Logo({ size = 32, className = '' }) {
  return (
    <img 
      src="/favicon.svg" 
      alt="NerdsBattle" 
      width={size} 
      height={size}
      className={`rounded-xl ${className}`}
    />
  )
}
