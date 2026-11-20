import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <Zap className="h-6 w-6 text-primary transition-transform group-hover:scale-110" fill="currentColor" />
        <span className="text-2xl font-black tracking-tighter">
          FOR<span className="text-primary">GE</span>
        </span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl" />
        <div className="relative bg-surface border border-border rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-text-muted">
        © {new Date().getFullYear()} FORGE. All rights reserved.
      </p>
    </div>
  );
}
