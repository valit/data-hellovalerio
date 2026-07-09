interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}

export default function Widget({ title, children, className = "", headerExtra }: WidgetProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h2 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">
          {title}
        </h2>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}
