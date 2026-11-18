export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-semibold ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg border border-gold/60 text-gold">S</span>
      Sacra<span className="text-gold">Bank</span>
    </span>
  );
}
