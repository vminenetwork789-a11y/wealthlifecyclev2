import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-sky-400 mb-2">404</h2>
        <p className="text-slate-300 text-lg font-medium mb-1">Page Not Found</p>
        <p className="text-slate-400 mb-6 text-sm">
          The requested page could not be found.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium text-sm shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition cursor-pointer"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
