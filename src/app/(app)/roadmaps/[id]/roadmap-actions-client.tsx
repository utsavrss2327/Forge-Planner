"use client";
import Link from "next/link";
export function RoadmapActionsClient({ roadmapId }: { roadmapId: string }) {
  return (
    <Link
      href="/planner/customize"
      className="forge-button"
      data-roadmap={roadmapId}
    >
      Customize and approve routine
    </Link>
  );
}
