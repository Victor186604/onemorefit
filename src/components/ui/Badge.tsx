import { cn } from '@/lib/utils'

export function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', cls)}>{children}</span>
}
