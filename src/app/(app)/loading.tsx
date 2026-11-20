export default function WorkspaceLoading() {
  return <div role="status" aria-label="Loading workspace" className="space-y-4"><div className="h-10 w-56 animate-pulse rounded bg-elevated motion-reduce:animate-none" /><div className="h-40 animate-pulse rounded-xl border border-border bg-surface motion-reduce:animate-none" /><p className="text-sm text-text-muted">Loading your preparation workspace…</p></div>;
}
