"use client";

import React, { useState, useRef, useEffect } from "react";

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPdf: () => void;
  isLoading?: boolean;
}

export function ExportDropdown({ onExportExcel, onExportPdf, isLoading = false }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition duration-300 shadow-sm text-xs disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span className="material-symbols-outlined text-[18px]">download</span>
        )}
        Export
        <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => handleAction(onExportExcel)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-500">table_view</span>
            Export Excel (.xlsx)
          </button>
          <button
            onClick={() => handleAction(onExportPdf)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-rose-500">picture_as_pdf</span>
            Export PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
