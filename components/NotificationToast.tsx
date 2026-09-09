'use client';

import React from 'react';
import { useWallet } from '../lib/wallet-context';
import { CheckCircle2, Ghost, Sparkles, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toast } = useWallet();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className={`p-4 rounded-3xl glass shadow-2xl border flex items-start gap-3.5 ${
        toast.type === 'reward' 
          ? 'border-emerald-500/50 bg-emerald-950/60 text-white' 
          : toast.type === 'ghost' 
          ? 'border-purple-500/50 bg-purple-950/60 text-white' 
          : toast.type === 'success' 
          ? 'border-sky-500/50 bg-sky-950/60 text-white' 
          : 'border-slate-700 bg-slate-900/90 text-slate-200'
      }`}>
        <div className="p-2.5 rounded-2xl shrink-0">
          {toast.type === 'reward' && <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />}
          {toast.type === 'ghost' && <Ghost className="w-5 h-5 text-purple-400 animate-bounce" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-slate-400" />}
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs">{toast.title}</h4>
            {toast.amount && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                +${toast.amount.toFixed(2)} USDT
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
};
