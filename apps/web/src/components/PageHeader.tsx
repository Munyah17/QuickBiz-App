export function PageHeader({
  module,
  title,
  action,
}: {
  module?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-text-primary">
        {module && <span className="text-text-tertiary">{module} · </span>}
        {title}
      </h1>
      {action}
    </div>
  );
}
