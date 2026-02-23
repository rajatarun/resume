export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 py-6 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto w-full max-w-6xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Tarun Raja.
      </div>
    </footer>
  );
}
