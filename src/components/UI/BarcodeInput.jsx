import { useEffect, useRef } from 'react'

/**
 * USB/Bluetooth barcode scanners act as keyboards: they "type" the code
 * very fast into whatever input is focused, then send an Enter/Tab.
 * This component keeps a hidden-ish input auto-focused so scans land here
 * and fire onScan(code) on Enter, without interfering with other fields
 * (editing a cart quantity, closing a modal, etc. keeps focus there instead).
 */
export default function BarcodeInput({ onScan, placeholder = 'امسح الباركود أو أدخله يدويًا...', autoFocus = true, className = '' }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const refocus = () => {
    // Give priority back to the scanner input shortly after any interaction,
    // unless focus moved to another real input/select/textarea/button.
    setTimeout(() => {
      const active = document.activeElement
      const tag = active?.tagName
      if (!active || (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'BUTTON')) {
        inputRef.current?.focus()
      }
    }, 50)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = e.currentTarget.value.trim()
      if (value) {
        onScan(value)
        e.currentTarget.value = ''
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <i className="fa-solid fa-barcode absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onBlur={refocus}
        className="w-full pr-9 pl-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
        autoComplete="off"
      />
    </div>
  )
}
