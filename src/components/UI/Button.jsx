const VARIANTS = {
  primary: 'bg-[#445b7a] hover:bg-[#364a63] text-white',
  success: 'bg-[#6AC085] hover:bg-[#5aa873] text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  ghost: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
  outline: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
}

export default function Button({
  children,
  variant = 'primary',
  icon,
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <i className="fa-solid fa-spinner fa-spin" />
      ) : (
        icon && <i className={icon} />
      )}
      {children}
    </button>
  )
}
