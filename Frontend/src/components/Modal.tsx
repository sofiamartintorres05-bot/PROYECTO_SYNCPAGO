import React from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  return (
    <div className={`modal-overlay${open ? " open" : ""}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-back" onClick={onClose} role="button" aria-label="Cerrar">
            ✕
          </span>
          <h2>{title}</h2>
          <span style={{ width: "1.1rem" }} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}