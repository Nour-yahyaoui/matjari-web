export default function DataTable({ columns, rows, loading, emptyText = 'لا توجد بيانات' }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-xs text-gray-400">
                جارِ التحميل...
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-xs text-gray-400">
                {emptyText}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
