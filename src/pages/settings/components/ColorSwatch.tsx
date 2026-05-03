import { cn } from '@/lib/utils'

export function ColorSwatch({
  color,
  selected,
  onClick,
  title,
}: {
  color: string
  selected?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? color}
      style={{ backgroundColor: color }}
      className={cn(
        'h-7 w-7 rounded-full border transition-all hover:scale-110',
        selected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border/60',
      )}
      aria-label={title ?? color}
    />
  )
}
