"use client";

import { useState } from "react";
import { BookOpen, Sparkles, Code, HelpCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveJournalEntryAction } from "@/app/(app)/learning/actions";

interface JournalModalProps {
  trackId?: string;
  triggerButton?: React.ReactNode;
}

export function JournalModal({ trackId, triggerButton }: JournalModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (trackId) {
      formData.append("trackId", trackId);
    }
    setError("");
    try {
      const result = await saveJournalEntryAction(formData);
      if (result.error) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    } catch { setError("Could not save your reflection. Please retry."); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2 font-semibold">
            <BookOpen className="h-4 w-4" />
            What Did You Learn Today?
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-surface border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Daily Learning Reflection & Concept Journal
          </DialogTitle>
          <p className="text-xs text-text-muted">
            Save concepts and uncertainties as source material for future recall assessments.
          </p>
        </DialogHeader>

        {saved ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Journal Saved Successfully!</h3>
            <p className="text-xs text-text-muted">
              Your notes have been recorded for review and future assessments.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && <p role="alert" className="text-sm text-primary">{error}</p>}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-text-primary">
                Executive Summary: What did you learn or solve today? *
              </Label>
              <Textarea
                name="summary"
                required
                rows={3}
                placeholder="e.g. Mastered binary search on answers using monotonicity predicates. Studied BCNF decomposition and why functional dependencies might be lost in BCNF."
                className="bg-elevated text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-text-primary">
                Key Concepts Mastered (comma-separated tags)
              </Label>
              <Input
                name="concepts"
                placeholder="Binary Search, Monotonicity, BCNF, 3NF, Dependency Preservation"
                className="bg-elevated text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  Confusing / Ambiguous Topics
                </Label>
                <Input
                  name="confusingTopics"
                  placeholder="e.g. Proving dependency preservation"
                  className="bg-elevated text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-secondary">
                  Personal Questions for AI Mentor
                </Label>
                <Input
                  name="questions"
                  placeholder="e.g. Why can 3NF preserve dependencies while BCNF cannot?"
                  className="bg-elevated text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-text-muted" />
                Key Code Snippet / Algorithm Implementation
              </Label>
              <Textarea
                name="codeSnippet"
                rows={4}
                placeholder={`// Enter code snippet or pattern\nint mid = low + (high - low) / 2;\nif (isFeasible(mid)) {\n    ans = mid;\n    high = mid - 1;\n}`}
                className="bg-elevated font-mono text-xs leading-normal"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="gap-1.5 font-semibold">
                {loading ? "Recording Entry..." : "Save Learning Entry"}
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
