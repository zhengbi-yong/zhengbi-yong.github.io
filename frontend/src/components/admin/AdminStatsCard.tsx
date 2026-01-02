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

export default function AdminStatsCard({ title, value, icon, color }: AdminStatsCardProps) {
  return (
    <div className={`${bgColorClasses[color]} overflow-hidden shadow rounded-lg`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                {value.toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
