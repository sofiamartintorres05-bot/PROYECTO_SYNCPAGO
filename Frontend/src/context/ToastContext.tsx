import React, { createContext, useCallback, useRef, useState } from "react";

interface ToastContextValue {
  mostrarToast: (mensaje: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mensaje, setMensaje] = useState("");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback((texto: string) => {
    setMensaje(texto);
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className={`toast${visible ? " show" : ""}`} role="status" aria-live="polite">
        {mensaje}
      </div>
    </ToastContext.Provider>
  );
}