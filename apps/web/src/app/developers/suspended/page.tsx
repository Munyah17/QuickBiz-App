export default function DeveloperSuspended() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-workspace p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold text-text-primary">Account suspended</h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Your developer account has been suspended. API keys are disabled and your modules are hidden from the
          Module Store. Contact support if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
