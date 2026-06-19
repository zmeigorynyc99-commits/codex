import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-content flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-black text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-600 dark:text-slate-400">
        The page you’re looking for doesn’t exist or may have moved. Try searching for a tool instead.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">Go home</Link>
        <Link href="/tools" className="btn-secondary">All tools</Link>
      </div>
    </div>
  );
}
