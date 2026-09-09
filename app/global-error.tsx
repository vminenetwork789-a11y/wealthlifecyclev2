'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-amber-400 mb-2">
            Application Error
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
