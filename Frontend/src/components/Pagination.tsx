import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  const inicio = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination">
      <span>
        Mostrando {inicio}-{fin} de {totalItems}
      </span>
      <div className="page-btns">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Anterior
        </button>
        <span className="page-info">
          {page} / {totalPages || 1}
        </span>
        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}