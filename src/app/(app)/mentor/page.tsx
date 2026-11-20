import { Bot, Sparkles } from "lucide-react";
import { getMentorContextAction } from "./actions";
import { MentorClient } from "./mentor-client";

export const dynamic = "force-dynamic";

export default async function MentorPage() {
  const data = await getMentorContextAction();
  const initialMessages = data.conversations.length > 0
    ? data.conversations[0].messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    : [];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary flex items-center gap-2.5">
          <Bot className="h-7 w-7 text-primary" />
          AI Placement Mentor & Specialist Agents
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Four dedicated agents grounded in your real study journals, code submissions, and assessment diagnostics.
        </p>
      </div>

      <MentorClient initialHistory={initialMessages} />
    </div>
  );
}
