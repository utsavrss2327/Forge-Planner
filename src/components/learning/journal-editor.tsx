"use client";
import { useState } from "react";

import {
  updateJournalEntryAction,
  deleteJournalEntryAction,
} from "@/app/(app)/learning/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { JournalEntry } from "@/types";

export function JournalEditor({ journal }: { journal: JournalEntry }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [version, setVersion] = useState(journal.updated_at);
  async function save(form: FormData) {
    setBusy(true);
    setError("");
    form.set("journalId", journal.id);
    form.set("expectedUpdatedAt", version);
    try {
      const result = await updateJournalEntryAction(form);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
      }
    } catch {
      setError("Could not save your reflection. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("Delete this reflection? This cannot be undone."))
      return;
    setBusy(true);
    setError("");
    try {
      const result = await deleteJournalEntryAction(journal.id, version);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
      }
    } catch {
      setError("Could not delete this reflection. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setVersion(journal.updated_at);
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit reflection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-surface">
        <DialogHeader>
          <DialogTitle>Edit reflection — {journal.date}</DialogTitle>
        </DialogHeader>
        <form action={save} className="space-y-3">
          {error && (
            <p role="alert" className="text-primary">
              {error}
            </p>
          )}
          <label className="block text-sm">
            Summary
            <Textarea
              name="summary"
              rows={5}
              defaultValue={journal.summary ?? ""}
            />
          </label>
          <label className="block text-sm">
            Concepts (comma separated)
            <Input name="concepts" defaultValue={journal.concepts.join(", ")} />
          </label>
          <label className="block text-sm">
            Confusing topics
            <Input
              name="confusingTopics"
              defaultValue={journal.confusing_topics.join(", ")}
            />
          </label>
          <label className="block text-sm">
            Questions
            <Input
              name="questions"
              defaultValue={journal.questions.join(", ")}
            />
          </label>
          <label className="block text-sm">
            Snippet language
            <Input
              name="language"
              defaultValue={journal.code_snippets[0]?.language ?? "text"}
            />
          </label>
          <label className="block text-sm">
            Code snippet
            <Textarea
              name="codeSnippet"
              rows={5}
              defaultValue={journal.code_snippets[0]?.code ?? ""}
              className="font-mono"
            />
          </label>
          <div className="flex justify-between">
            <Button type="submit" disabled={busy}>
              Save reflection
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={remove}
            >
              Delete reflection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
