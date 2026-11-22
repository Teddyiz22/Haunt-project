import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, { to, actionLabel } = {}) => {
    const id = ++toastId
    setToasts((current) => [...current.slice(-2), { id, message, to, actionLabel }])
    const timer = setTimeout(() => dismissToast(id), 4500)
    timers.current.set(id, timer)
    return id
  }, [dismissToast])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id} role="status">
            <Check aria-hidden="true" size={16} strokeWidth={2} />
            <span>{toast.message}</span>
            {toast.to && (
              <Link to={toast.to} onClick={() => dismissToast(toast.id)}>
                {toast.actionLabel || 'View'}
              </Link>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used inside a ToastProvider.')
  return toast
}
