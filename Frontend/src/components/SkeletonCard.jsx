// Reusable animated shimmer skeleton for loading states
export default function SkeletonCard({ className = '', lines = 3, height = 'h-5' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}
