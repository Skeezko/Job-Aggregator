export function Footer() {
  return (
    <footer
      className="border-t border-zinc-800 px-6 py-5 text-center text-xs text-zinc-600"
      role="contentinfo"
    >
      <p>
        JobAggregator &copy; {new Date().getFullYear()} · Epitech ·{" "}
        <span className="text-zinc-500">Données fournies par WeLoveDevs</span>
      </p>
    </footer>
  );
}
