"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RevisionItem } from "@/types";
import { Brain, CheckCircle2, Eye } from "lucide-react";

import { useState } from "react";
import { rateRevisionItemAction } from "./actions";

interface RevisionClientProps {
  dueItems: RevisionItem[];
  upcomingItems: RevisionItem[];
}

export function RevisionClient({
  dueItems,
  upcomingItems,
}: RevisionClientProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentItem = dueItems[currentIdx];

  const handleRate = async (quality: number) => {
    if (!currentItem) return;
    setLoading(true);
    setError("");
    try {
      const r = await rateRevisionItemAction(currentItem.id, quality);
      if (r.error) {
        setError(r.error);
        setLoading(false);
        return;
      }
    } catch {
      setError("Review not saved. Please retry.");
      setLoading(false);
      return;
    }
    setLoading(false);
    setRevealed(false);
    // The action revalidates this route and removes the rated item from dueItems.
    // Start with the first remaining item instead of skipping it after the refresh.
    setCurrentIdx(0);
  };

  if (dueItems.length === 0) {
    return (
      <Card className="bg-surface border-border p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-success/10 text-success mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">
          No reviews due right now
        </h3>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          Due reviews appear here after assessment feedback or earlier recall
          ratings. Take an assessment to build your revision queue.
        </p>

        {upcomingItems.length > 0 && (
          <div className="pt-4 max-w-md mx-auto text-left space-y-2">
            <h4 className="text-xs font-bold text-text-muted uppercase">
              Upcoming Scheduled Reviews:
            </h4>
            {upcomingItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-elevated border border-border flex justify-between items-center text-xs"
              >
                <span className="font-semibold text-text-primary">
                  {item.topic}
                </span>
                <span className="text-text-muted">
                  Due: {item.next_review_date}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      <div className="space-y-6">
        {/* Active Flashcard Queue Card */}
        <Card className="bg-surface border-border overflow-hidden">
          <CardHeader className="p-5 pb-3 bg-elevated/40 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-bold">
                Card {currentIdx + 1} of {dueItems.length}
              </Badge>
              <span className="text-xs text-text-muted font-medium">
                Subject: {currentItem.subject}
              </span>
            </div>
            <span className="text-xs text-text-muted font-mono">
              Repetitions: {currentItem.repetitions} · Interval:{" "}
              {currentItem.interval_days}d
            </span>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Topic: {currentItem.topic}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary leading-relaxed">
                {currentItem.content}
              </h3>
            </div>

            {!revealed ? (
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={() => setRevealed(true)}
                  className="w-full gap-2 font-bold h-12"
                >
                  <Eye className="h-4 w-4" />
                  Reveal Key Concept & Solution Invariant
                </Button>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="p-4 rounded-xl bg-elevated border border-primary/30 space-y-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Brain className="h-4 w-4" />
                    Recall Rubric / Theoretical Invariant
                  </span>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    Verify whether your mental recall included: (1) Time &
                    auxiliary space complexities, (2) Boundary condition
                    edge-cases, (3) Mathematical or logical invariant
                    underpinning the concept.
                  </p>
                </div>

                {/* SM-2 Recall Quality Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-text-muted">
                    Rate Your Recall Difficulty (SM-2 Spaced Repetition):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRate(1)}
                      className="flex flex-col h-auto py-2.5 text-error border-error/30 hover:bg-error/10"
                    >
                      <span className="font-bold text-xs">1 — Blackout</span>
                      <span className="text-[10px] text-text-muted">
                        Reset (1d)
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRate(2)}
                      className="flex flex-col h-auto py-2.5 text-warning border-warning/30 hover:bg-warning/10"
                    >
                      <span className="font-bold text-xs">2 — Hard</span>
                      <span className="text-[10px] text-text-muted">
                        Mistakes (1d)
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRate(3)}
                      className="flex flex-col h-auto py-2.5 text-text-primary border-border hover:bg-elevated"
                    >
                      <span className="font-bold text-xs">3 — Good</span>
                      <span className="text-[10px] text-text-muted">
                        Hesitation (3d)
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRate(4)}
                      className="flex flex-col h-auto py-2.5 text-success border-success/30 hover:bg-success/10"
                    >
                      <span className="font-bold text-xs">4 — Easy</span>
                      <span className="text-[10px] text-text-muted">
                        Confident
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRate(5)}
                      className="flex flex-col h-auto py-2.5 text-primary border-primary/30 hover:bg-primary/10"
                    >
                      <span className="font-bold text-xs">5 — Perfect</span>
                      <span className="text-[10px] text-text-muted">
                        Instant
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
