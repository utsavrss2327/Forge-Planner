"use client";

import { useState } from "react";
import { Plus, Video as Youtube, BookOpen, Sparkles } from "lucide-react";
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
import { PREPARATION_SUBJECTS } from "@/lib/constants";
import { createLearningTrackAction } from "@/app/(app)/learning/actions";

export function CreateTrackDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    setError("");
    try {
      const result = await createLearningTrackAction(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    } catch {
      setError("Could not save the track. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <Plus className="h-4 w-4" />
          Create Learning Track
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            New Learning Track & Playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p role="alert" className="text-sm text-primary">{error}</p>}
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Track Title *</Label>
            <Input
              name="title"
              required
              placeholder="e.g. Striver's Dynamic Programming Masterclass"
              className="bg-elevated"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Subject Domain</Label>
              <select
                name="subject"
                className="w-full h-9 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PREPARATION_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Priority Level</Label>
              <select
                name="priority"
                className="w-full h-9 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="critical">Critical (Immediate placement test)</option>
                <option value="high">High (Core requirement)</option>
                <option value="medium">Medium (Regular schedule)</option>
                <option value="low">Low (Supplemental)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary flex items-center gap-1.5">
              <Youtube className="h-4 w-4 text-primary" />
              YouTube Playlist URL (Optional — Auto-imports videos & durations)
            </Label>
            <Input
              name="playlistUrl"
              placeholder="https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hZctH45dyoQ"
              className="bg-elevated"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Target Placement Outcome</Label>
            <Input
              name="targetOutcome"
              placeholder="e.g. Master 1D, 2D, and Tree DP state transitions with O(1) space"
              className="bg-elevated"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Daily Goal</Label>
              <Input
                name="dailyGoal"
                placeholder="2 videos + 3 LeetCode"
                className="bg-elevated"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Target Completion Date</Label>
              <Input type="date" name="deadline" className="bg-elevated" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Description / Personal Strategy</Label>
            <Textarea
              name="description"
              rows={2}
              placeholder="Write personal focus points, recommended approach, or difficulty areas..."
              className="bg-elevated text-xs"
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
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              {loading ? "Importing & Creating..." : "Save Learning Track"}
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
