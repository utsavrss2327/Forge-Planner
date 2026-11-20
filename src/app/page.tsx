import Link from "next/link";
import {
  Brain,
  Map,
  BookOpen,
  Code2,
  RotateCcw,
  Briefcase,
  ArrowRight,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI Assessments",
    description:
      "Personalized 60-minute tests generated from your notes and weak areas. Get detailed feedback and growth reports after every assessment.",
  },
  {
    icon: Map,
    title: "Smart Roadmaps",
    description:
      "AI-generated preparation roadmaps tailored to your target role, timeline, and current level. Dynamically rebalanced as you progress.",
  },
  {
    icon: BookOpen,
    title: "Learning Tracker",
    description:
      "Track YouTube playlists, learning journals, and resource links in one place. Never lose track of what you've learned.",
  },
  {
    icon: Code2,
    title: "DSA Practice",
    description:
      "Track your LeetCode/DSA problem-solving progress by topic and difficulty. Identify patterns and gaps in your problem-solving.",
  },
  {
    icon: RotateCcw,
    title: "Spaced Repetition",
    description:
      "Smart revision scheduling based on your performance. Topics you struggle with get reviewed more frequently.",
  },
  {
    icon: Briefcase,
    title: "Job Applications",
    description:
      "Track your entire job search pipeline — from saving JDs to offer letters. Never miss a follow-up or deadline.",
  },
];

const stats = [
  { value: "11", label: "Integrated Modules" },
  { value: "AI", label: "Powered Insights" },
  { value: "360°", label: "Placement Coverage" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" fill="currentColor" />
            <span className="text-lg font-bold tracking-tight">
              FOR<span className="text-primary">GE</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-8">
            <Zap className="h-3 w-3" fill="currentColor" />
            AI-Powered Placement Preparation
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
            <span className="text-text-primary">FOR</span>
            <span className="text-primary">GE</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            Transform ambition into achievement.
          </p>
          <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered placement preparation for future software engineers.
            Roadmaps, assessments, DSA practice, and job tracking — all in one OS.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 group px-8">
                Start Your Journey
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                Login
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-primary">{stat.value}</div>
                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything you need to{" "}
              <span className="text-primary">crack placements</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              FORGE combines AI intelligence with structured preparation to give you an unfair advantage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative p-6 rounded-xl border border-border bg-surface hover:bg-elevated hover:border-border-light transition-all duration-300"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative">
                    <div className="inline-flex p-2.5 rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 blur-[60px] rounded-2xl" />
            <div className="relative">
              <Zap className="h-8 w-8 text-primary mx-auto mb-6" fill="currentColor" />
              <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
                Ready to <span className="text-primary">FORGE</span> your future?
              </h2>
              <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                Join thousands of aspiring engineers who are using FORGE to land their dream jobs at top tech companies.
              </p>
              <Link href="/signup">
                <Button size="lg" className="gap-2 group px-8">
                  Start for Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="text-sm font-bold">
              FOR<span className="text-primary">GE</span>
            </span>
          </div>
          <p className="text-xs text-text-muted">
            © 2024 FORGE. AI-Powered SDE Placement OS.
          </p>
        </div>
      </footer>
    </div>
  );
}
