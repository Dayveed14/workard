import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Bell, X } from 'lucide-react';
import './ToastContext.css';

// Small pop-up messages:  const toast = useToast(); toast.success('Saved');
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api = {
    success: (m) => show('success', m),
    error: (m) => show('error', m),
    info: (m) => show('info', m), // e.g. a new notification arrived
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'info' ? <Bell size={18} /> : <AlertCircle size={18} />}
            <span>{t.message}</span>
            <button type="button" onClick={() => remove(t.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
