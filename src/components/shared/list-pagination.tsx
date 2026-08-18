'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
  total: number;
  itemLabel: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ListPagination({
  total,
  itemLabel,
  page,
  totalPages,
  onPageChange,
  className = '',
}: ListPaginationProps) {
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => (
      pageNumber === 1
      || pageNumber === totalPages
      || Math.abs(pageNumber - page) <= 1
    ));

  return (
    <div className={`flex flex-col items-center gap-2.5 mt-4 sm:flex-row sm:justify-between ${className}`}>
      <span className="text-[11px] text-[#8E8E93] font-medium">
        {total} {itemLabel} · Trang {page}/{totalPages}
      </span>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Trang trước"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 active:scale-95 transition-all"
        >
          <ChevronLeft size={14} />
        </button>

        {visiblePages.map((pageNumber, index) => (
          <span key={pageNumber} className="flex items-center">
            {index > 0 && visiblePages[index - 1] !== pageNumber - 1 && (
              <span className="px-1 text-[11px] text-[#B0B0B8]">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Trang ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
              className={`w-[32px] h-[32px] rounded-[8px] text-[12px] font-semibold transition-all ${
                pageNumber === page
                  ? 'bg-[#E6002D] text-white shadow-sm'
                  : 'bg-white text-[#5F6368] hover:bg-[rgba(0,0,0,0.04)]'
              }`}
            >
              {pageNumber}
            </button>
          </span>
        ))}

        <button
          type="button"
          aria-label="Trang sau"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center border border-[rgba(0,0,0,0.06)] bg-white text-[#5F6368] disabled:opacity-30 active:scale-95 transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
