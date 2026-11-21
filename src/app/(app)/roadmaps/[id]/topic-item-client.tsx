"use client";
import type { RoadmapTopic } from "@/types";

import { useState } from "react";
import { updateTopicStatusAction } from "../actions";
export function TopicItemClient({ topic }: { topic: RoadmapTopic }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div>
      {error && (
        <p role="alert" className="forge-error">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="forge-button-secondary mt-2"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await updateTopicStatusAction(
              topic.id,
              topic.status === "completed" ? "pending" : "completed",
            );
            if (r.error) setError(r.error);
          } catch {
            setError("Topic could not be updated.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {topic.status === "completed" ? "Reopen topic" : "Mark learned"}
      </button>
    </div>
  );
}
