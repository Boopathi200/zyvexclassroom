export function GlassCard({ className = '', children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
