export function Input({ label, className = '', ...props }) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</span>}
      <input
        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a] ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, options = [], className = '', ...props }) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</span>}
      <select
        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a] ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
