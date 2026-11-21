"use client";

import { createDsaProblemAction } from "@/app/(app)/dsa/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DSA_TOPICS } from "@/lib/constants";
import { Code2, Plus } from "lucide-react";
import { useState } from "react";

export function AddProblemDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    setError("");
    try {
      const result = await createDsaProblemAction(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    } catch {
      setError("Could not save. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <Plus className="h-4 w-4" />
          Log DSA Problem
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Log Coding Problem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <p role="alert" className="forge-error">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">
              Problem Name *
            </Label>
            <Input
              name="name"
              required
              placeholder="e.g. Trapping Rain Water"
              className="bg-elevated"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Problem URL</Label>
            <Input
              name="url"
              placeholder="https://leetcode.com/problems/trapping-rain-water/"
              className="bg-elevated"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Topic</Label>
              <select
                name="topic"
                className="w-full h-9 rounded-md bg-elevated border border-border px-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DSA_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Difficulty</Label>
              <select
                name="difficulty"
                className="w-full h-9 rounded-md bg-elevated border border-border px-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs text-text-secondary">Status</Label>
              <select
                name="status"
                className="w-full h-9 rounded-md bg-elevated border border-border px-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
                <option value="pending">Pending</option>
                <option value="revision_needed">Needs Revision</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">
              Time Spent (Minutes)
            </Label>
            <Input
              type="number"
              name="timeTaken"
              defaultValue="30"
              className="bg-elevated"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">
              Solution Approach & Invariants
            </Label>
            <Textarea
              name="solutionNotes"
              rows={2}
              placeholder="e.g. Two-pointer tracking left_max and right_max. O(N) time, O(1) space."
              className="bg-elevated text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">
              Mistakes / Tricky Edge Cases
            </Label>
            <Textarea
              name="mistakes"
              rows={2}
              placeholder="e.g. Made an off-by-one error with index boundaries on the monotonic stack."
              className="bg-elevated text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="needsRevision"
              name="needsRevision"
              value="true"
              className="accent-primary rounded"
            />
            <Label
              htmlFor="needsRevision"
              className="text-xs text-text-secondary cursor-pointer"
            >
              Queue for Spaced Repetition Revision
            </Label>
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
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? "Saving..." : "Log Problem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
