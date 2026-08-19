import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
}

function AlertModal({ 
  opts, 
  type, 
  onClose 
}: { 
  opts: AlertOptions; 
  type: string; 
  onClose: () => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    if (type === 'success') return 'check_circle';
    if (type === 'error') return 'error';
    if (type === 'warning') return 'warning';
    return 'info';
  };

  const getColorClasses = () => {
    if (type === 'success') return { icon: 'text-emerald-500 bg-emerald-50 border-emerald-100', btn: 'bg-emerald-500 hover:bg-emerald-600' };
    if (type === 'error') return { icon: 'text-red-500 bg-red-50 border-red-100', btn: 'bg-red-500 hover:bg-red-600' };
    if (type === 'warning') return { icon: 'text-amber-500 bg-amber-50 border-amber-100', btn: 'bg-amber-500 hover:bg-amber-600' };
    return { icon: 'text-blue-500 bg-blue-50 border-blue-100', btn: 'bg-blue-500 hover:bg-blue-600' };
  };

  const colors = getColorClasses();

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-slate-900/60 backdrop-blur-xs' : 'bg-slate-900/0 backdrop-blur-none'}`}>
      <div className={`bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mb-4 ${colors.icon}`}>
          <span className="material-symbols-outlined text-[32px]">{getIcon()}</span>
        </div>
        
        {opts.title && (
          <h3 className="text-slate-800 font-bold text-sm mb-2">{opts.title}</h3>
        )}
        
        <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-6 whitespace-pre-line">{opts.message}</p>
        
        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition duration-200 ${colors.btn}`}
        >
          {opts.confirmText || 'OK'}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ 
  opts, 
  type, 
  onClose 
}: { 
  opts: ConfirmOptions; 
  type: string; 
  onClose: (result: boolean) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    if (type === 'success') return 'check_circle';
    if (type === 'error') return 'error';
    if (type === 'warning') return 'help';
    return 'info';
  };

  const getColorClasses = () => {
    if (type === 'success') return { icon: 'text-emerald-500 bg-emerald-50 border-emerald-100', btn: 'bg-emerald-500 hover:bg-emerald-600' };
    if (type === 'error') return { icon: 'text-red-500 bg-red-50 border-red-100', btn: 'bg-red-500 hover:bg-red-600' };
    if (type === 'warning') return { icon: 'text-amber-500 bg-amber-50 border-amber-100', btn: 'bg-[#F7A440] hover:bg-[#e09132]' };
    return { icon: 'text-blue-500 bg-blue-50 border-blue-100', btn: 'bg-blue-500 hover:bg-blue-600' };
  };

  const colors = getColorClasses();

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-slate-900/60 backdrop-blur-xs' : 'bg-slate-900/0 backdrop-blur-none'}`}>
      <div className={`bg-white rounded-2xl w-full max-w-sm border border-slate-100 shadow-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mb-4 ${colors.icon}`}>
          <span className="material-symbols-outlined text-[32px]">{getIcon()}</span>
        </div>
        
        {opts.title && (
          <h3 className="text-slate-800 font-bold text-sm mb-2">{opts.title}</h3>
        )}
        
        <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-6 whitespace-pre-line">{opts.message}</p>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => onClose(false)}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition duration-200"
          >
            {opts.cancelText || 'Batal'}
          </button>
          <button
            onClick={() => onClose(true)}
            className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition duration-200 ${colors.btn}`}
          >
            {opts.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function customAlert(options: AlertOptions | string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const opts: AlertOptions = typeof options === 'string' ? { message: options } : options;
    const type = opts.type || 'info';

    // Create a container element
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const handleClose = () => {
      root.unmount();
      container.remove();
      resolve();
    };

    root.render(
      <AlertModal opts={opts} type={type} onClose={handleClose} />
    );
  });
}

export function customConfirm(options: ConfirmOptions | string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
    const type = opts.type || 'warning';

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const handleClose = (result: boolean) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(
      <ConfirmModal opts={opts} type={type} onClose={handleClose} />
    );
  });
}
