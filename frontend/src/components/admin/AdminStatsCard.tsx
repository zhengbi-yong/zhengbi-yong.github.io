import { cn } from '@/lib/utils'

interface AdminStatsCardProps {
  title: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'emerald' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-500 dark:bg-blue-600',
  green: 'bg-green-500 dark:bg-green-600',
  yellow: 'bg-yellow-500 dark:bg-yellow-600',
  emerald: 'bg-emerald-500 dark:bg-emerald-600',
  red: 'bg-red-500 dark:bg-red-600',
}

const bgColorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20',
  green: 'bg-green-50 dark:bg-green-900/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
  red: 'bg-red-50 dark:bg-red-900/20',
}

const cardBaseClassName =
  'overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)]'
const iconBaseClassName = 'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-6px)] text-2xl shadow-sm'

export default function AdminStatsCard({ title, value, icon, color }: AdminStatsCardProps) {
  return (
    <div className={cn(cardBaseClassName, bgColorClasses[color])}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn(iconBaseClassName, colorClasses[color])}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-xs font-semibold tracking-[0.12em] text-[var(--text-soft)] uppercase">
                {title}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {value.toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
