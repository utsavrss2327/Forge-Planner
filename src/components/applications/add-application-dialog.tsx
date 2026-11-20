"use client";

import { useState } from "react";
import { Plus, Briefcase, Building, MapPin, Link2 } from "lucide-react";
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
import { APPLICATION_STATUSES } from "@/lib/constants";
import { createApplicationAction } from "@/app/(app)/applications/actions";

export function AddApplicationDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createApplicationAction(formData);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Track Placement Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Company Name *</Label>
              <Input
                name="company"
                required
                placeholder="e.g. Google / Amazon / Uber"
                className="bg-elevated"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Job Role / Title *</Label>
              <Input
                name="role"
                required
                placeholder="e.g. Software Engineer (SDE-1)"
                className="bg-elevated"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Pipeline Status</Label>
              <select
                name="status"
                defaultValue="applied"
                className="w-full h-9 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary capitalize"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Location</Label>
              <Input
                name="location"
                placeholder="e.g. Bengaluru / Hyderabad / Remote"
                className="bg-elevated"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Job Description URL</Label>
              <Input
                name="jobUrl"
                placeholder="https://careers.google.com/..."
                className="bg-elevated"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Referral / Source</Label>
              <Input
                name="referralStatus"
                placeholder="e.g. Senior SWE Referral / LinkedIn"
                className="bg-elevated"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Compensation Range</Label>
              <Input
                name="salaryRange"
                placeholder="e.g. ₹28L - ₹36L CTC"
                className="bg-elevated"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Application Deadline</Label>
              <Input type="date" name="deadline" className="bg-elevated" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Interview Strategy & Notes</Label>
            <Textarea
              name="notes"
              rows={3}
              placeholder="Record round formats, leadership principles required, or recruiters' details..."
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
              {loading ? "Adding..." : "Add to Pipeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
