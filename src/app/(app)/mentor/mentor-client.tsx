"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FlaskConical,
  Map,
  BarChart3,
  User,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { sendMentorMessageAction } from "./actions";
import type { AIAgentType } from "@/types";

interface MentorClientProps {
  initialHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

const agents: { type: AIAgentType; name: string; role: string; icon: any }[] = [
  {
    type: "learning_coach",
    name: "Learning Coach",
    role: "Answers technical doubts, explains complex invariants, and deepens conceptual intuition.",
    icon: BookOpen,
  },
  {
    type: "performance_analyst",
    name: "Performance Analyst",
    role: "Analyzes recurring assessment mistakes, diagnoses weaknesses, and evaluates readiness.",
    icon: BarChart3,
  },
  {
    type: "roadmap_planner",
    name: "Roadmap Planner",
    role: "Adapts study schedules, rebalances overdue tasks, and sets placement milestones.",
    icon: Map,
  },
  {
    type: "assessment_examiner",
    name: "Assessment Examiner",
    role: "Quizzes on core CS topics and designs evaluation rubrics for interview questions.",
    icon: FlaskConical,
  },
];

const suggestedPrompts = [
  "Explain why I keep failing graph problems",
  "What should I revise today?",
  "How prepared am I for an Amazon SDE-1 interview?",
  "Quiz me on DBMS normalization",
  "I have two hours today. What should I prioritize?",
];

export function MentorClient({ initialHistory = [] }: MentorClientProps) {
  const [selectedAgent, setSelectedAgent] = useState<AIAgentType>("learning_coach");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    initialHistory.length > 0
      ? initialHistory
      : [
          {
            role: "assistant",
            content:
              "Hello! I am your FORGE AI Mentor. I am grounded directly in your placement targets, active roadmap, and assessment performance. How can I assist your preparation today?",
          },
        ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeAgent = agents.find((a) => a.type === selectedAgent) || agents[0];
  const Icon = activeAgent.icon;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMentorMessageAction({
        agentType: selectedAgent,
        message: text,
        history: messages,
      });

      if (res.reply) {
        setMessages([...newMessages, { role: "assistant", content: res.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Agent Selector Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {agents.map((agent) => {
          const AgentIcon = agent.icon;
          const isSelected = selectedAgent === agent.type;
          return (
            <button
              key={agent.type}
              type="button"
              onClick={() => setSelectedAgent(agent.type)}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                isSelected
                  ? "bg-primary/10 border-primary text-text-primary ring-1 ring-primary"
                  : "bg-surface border-border text-text-muted hover:border-border-light hover:text-text-primary"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isSelected ? "bg-primary text-white" : "bg-elevated text-text-muted"
                }`}
              >
                <AgentIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">{agent.name}</div>
                <div className="text-[10px] text-text-muted line-clamp-1">{agent.role}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chat Window */}
      <Card className="bg-surface border-border flex flex-col h-[560px]">
        {/* Chat Header */}
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                {activeAgent.name}
                <Badge variant="outline" className="text-[10px] text-success border-success/30">
                  Online
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-text-muted">{activeAgent.role}</p>
            </div>
          </div>
        </CardHeader>

        {/* Messages Body */}
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : ""}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-white rounded-tr-none font-medium"
                      : "bg-elevated border border-border text-text-primary rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-elevated text-text-muted flex items-center justify-center shrink-0 mt-0.5 border border-border">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-elevated border border-border text-xs text-text-muted flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                Consulting preparation records & knowledge base...
              </div>
            </div>
          )}
        </CardContent>

        {/* Suggested Prompts Strip */}
        <div className="px-4 py-2 border-t border-border/40 flex gap-1.5 overflow-x-auto shrink-0 bg-surface">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-light shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border shrink-0 bg-surface">
          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${activeAgent.name} (e.g. "Explain graph cycle detection")...`}
              disabled={loading}
              className="text-xs bg-elevated h-10 border-border"
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()} className="gap-1.5 h-10 px-4 font-bold">
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
