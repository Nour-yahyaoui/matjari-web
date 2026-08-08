export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function KpiCard({ label, value, trend, trendColor = 'text-emerald-500', icon, iconBg, iconColor }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
          {trend && <span className={`text-[10px] sm:text-xs mt-2 inline-block ${trendColor}`}>{trend}</span>}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}>
          <i className={`${icon} text-sm sm:text-base`} />
        </div>
      </div>
    </Card>
  )
}
