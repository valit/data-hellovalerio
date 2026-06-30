interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Widget({ title, children, className = "" }: WidgetProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 ${className}`}>
      <h2 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}
