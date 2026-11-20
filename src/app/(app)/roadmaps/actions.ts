"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore, saveStore } from "@/lib/storage/store";
import { roadmapPlanner } from "@/lib/ai";
import type { Roadmap, RoadmapPhase, RoadmapMilestone, RoadmapTopic } from "@/types";

export async function getRoadmapsAction() {
  const store = getStore();
  const roadmaps = store.roadmaps;
  const phases = store.phases;
  const milestones = store.milestones;
  const topics = store.topics;

  return {
    roadmaps,
    phases,
    milestones,
    topics,
  };
}

export async function getRoadmapByIdAction(id: string) {
  const store = getStore();
  const roadmap = store.roadmaps.find((r) => r.id === id);
  if (!roadmap) return null;

  const phases = store.phases
    .filter((p) => p.roadmap_id === id)
    .sort((a, b) => a.order_index - b.order_index);

  const phaseIds = new Set(phases.map((p) => p.id));
  const milestones = store.milestones
    .filter((m) => phaseIds.has(m.phase_id))
    .sort((a, b) => a.order_index - b.order_index);

  const milestoneIds = new Set(milestones.map((m) => m.id));
  const topics = store.topics
    .filter((t) => milestoneIds.has(t.milestone_id))
    .sort((a, b) => a.order_index - b.order_index);

  return {
    roadmap,
    phases,
    milestones,
    topics,
  };
}

export async function createRoadmapWithAIAction(formData: FormData) {
  const targetRole = (formData.get("targetRole") as string) || "SDE-1 / Software Engineer";
  const durationDays = parseInt((formData.get("durationDays") as string) || "90", 10);
  const dailyHours = parseFloat((formData.get("dailyHours") as string) || "3.0");
  const currentLevel = (formData.get("currentLevel") as string) || "intermediate";
  const targetCompanies = ((formData.get("targetCompanies") as string) || "Google, Amazon, Microsoft")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const subjects = ((formData.get("subjects") as string) || "Data Structures & Algorithms,DBMS,OS,System Design")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let generated;
  try {
    generated = await roadmapPlanner.generateRoadmap({
      targetRole,
      targetCompanies,
      durationDays,
      dailyHours,
      currentLevel,
      subjects,
      existingKnowledge: ["Arrays", "Basic Math"],
    });
  } catch (err) {
    // High quality deterministic fallback if AI key not configured
    generated = {
      title: `${targetRole} Comprehensive ${durationDays}-Day Blueprint`,
      description: `Structured curriculum targeting top product companies (${targetCompanies.join(", ")}).`,
      totalEstimatedHours: durationDays * dailyHours,
      phases: [
        {
          title: "Phase 1: Advanced Algorithmic Patterns & DSA Core",
          description: "Two pointers, Sliding Window, Binary Search, Trees, and BSTs.",
          durationWeeks: Math.max(2, Math.floor(durationDays / 28)),
          milestones: [
            {
              title: "Searching, Sorting & Two Pointers",
              topics: [
                { title: "Binary Search on Monotonic Answer Spaces", estimatedHours: 8, prerequisites: [] },
                { title: "Variable Size Sliding Window & Deque", estimatedHours: 10, prerequisites: [] },
              ],
            },
            {
              title: "Hierarchical Structures & Trees",
              topics: [
                { title: "Binary Tree LCA & Diameter Optimization", estimatedHours: 12, prerequisites: [] },
                { title: "Binary Search Tree Validation & Range Queries", estimatedHours: 8, prerequisites: [] },
              ],
            },
          ],
        },
        {
          title: "Phase 2: Complex Graphs & Dynamic Programming",
          description: "Dijkstra, Topological Sort, 1D/2D DP, Knapsack & Tree DP.",
          durationWeeks: Math.max(2, Math.floor(durationDays / 28)),
          milestones: [
            {
              title: "Graph Algorithms",
              topics: [
                { title: "Breadth-First Search & Dijkstra's Algorithm", estimatedHours: 10, prerequisites: [] },
                { title: "Topological Sort & Cycle Detection", estimatedHours: 8, prerequisites: [] },
              ],
            },
            {
              title: "Dynamic Programming Fundamentals",
              topics: [
                { title: "0/1 Knapsack & Unbounded Space Optimization", estimatedHours: 12, prerequisites: [] },
                { title: "Longest Common Subsequence & Edit Distance", estimatedHours: 10, prerequisites: [] },
              ],
            },
          ],
        },
        {
          title: "Phase 3: Core Computer Science Fundamentals",
          description: "Operating Systems, DBMS, Concurrency, and Computer Networks.",
          durationWeeks: Math.max(2, Math.floor(durationDays / 28)),
          milestones: [
            {
              title: "Database Management Systems",
              topics: [
                { title: "ACID Properties & Transaction Isolation Levels", estimatedHours: 6, prerequisites: [] },
                { title: "Database Indexing (B+ Trees) & Query Optimization", estimatedHours: 8, prerequisites: [] },
              ],
            },
            {
              title: "Operating Systems & Networking",
              topics: [
                { title: "Virtual Memory, Paging, and Page Faults", estimatedHours: 6, prerequisites: [] },
                { title: "TCP/IP 3-Way Handshake & HTTP/HTTPS Protocols", estimatedHours: 6, prerequisites: [] },
              ],
            },
          ],
        },
      ],
    };
  }

  const store = getStore();
  const userId = "00000000-0000-0000-0000-000000000001";
  const roadmapId = `roadmap-${Date.now()}`;
  const today = new Date().toISOString().split("T")[0];

  const newRoadmap: Roadmap = {
    id: roadmapId,
    user_id: userId,
    title: generated.title,
    description: generated.description,
    target_role: targetRole,
    duration_days: durationDays,
    start_date: today,
    end_date: new Date(Date.now() + durationDays * 86400000).toISOString().split("T")[0],
    daily_hours: dailyHours,
    status: "active",
    source: "ai",
    total_tasks: 0,
    completed_tasks: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let totalTopicsCount = 0;

  generated.phases.forEach((phaseData, phaseIndex) => {
    const phaseId = `phase-${Date.now()}-${phaseIndex}`;
    const newPhase: RoadmapPhase = {
      id: phaseId,
      roadmap_id: roadmapId,
      title: phaseData.title,
      description: phaseData.description || null,
      order_index: phaseIndex,
      start_date: today,
      end_date: null,
      status: phaseIndex === 0 ? "in_progress" : "pending",
      created_at: new Date().toISOString(),
    };
    store.phases.push(newPhase);

    phaseData.milestones.forEach((mstoneData, mIndex) => {
      const milestoneId = `milestone-${Date.now()}-${phaseIndex}-${mIndex}`;
      const newMilestone: RoadmapMilestone = {
        id: milestoneId,
        phase_id: phaseId,
        title: mstoneData.title,
        description: null,
        order_index: mIndex,
        target_date: null,
        status: phaseIndex === 0 && mIndex === 0 ? "in_progress" : "pending",
        created_at: new Date().toISOString(),
      };
      store.milestones.push(newMilestone);

      mstoneData.topics.forEach((tData, tIndex) => {
        totalTopicsCount++;
        const topicId = `topic-${Date.now()}-${phaseIndex}-${mIndex}-${tIndex}`;
        const newTopic: RoadmapTopic = {
          id: topicId,
          milestone_id: milestoneId,
          title: tData.title,
          description: null,
          order_index: tIndex,
          estimated_hours: tData.estimatedHours || 4.0,
          status: "pending",
          created_at: new Date().toISOString(),
        };
        store.topics.push(newTopic);

        // Pre-create initial daily tasks from first milestone topics
        if (phaseIndex === 0 && mIndex === 0) {
          store.dailyTasks.push({
            id: `task-gen-${Date.now()}-${tIndex}`,
            user_id: userId,
            roadmap_id: roadmapId,
            learning_track_id: null,
            title: `Study: ${tData.title}`,
            description: `Core roadmap milestone topic. Spend ${dailyHours} hours studying theory and solving practice questions.`,
            subject: targetRole.includes("Frontend") ? "Frontend" : "Data Structures & Algorithms",
            estimated_minutes: Math.round(dailyHours * 60),
            actual_minutes: null,
            priority: "high",
            status: "pending",
            scheduled_date: today,
            source: "roadmap",
            source_url: null,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      });
    });
  });

  newRoadmap.total_tasks = totalTopicsCount;
  store.roadmaps.unshift(newRoadmap);
  saveStore(store);

  revalidatePath("/roadmaps");
  revalidatePath("/dashboard");
  revalidatePath("/planner");
  redirect(`/roadmaps/${roadmapId}`);
}

export async function generateDailyTasksFromRoadmapAction(roadmapId: string) {
  const store = getStore();
  const roadmap = store.roadmaps.find((r) => r.id === roadmapId);
  if (!roadmap) return { error: "Roadmap not found" };

  const phases = store.phases.filter((p) => p.roadmap_id === roadmapId);
  const phaseIds = new Set(phases.map((p) => p.id));
  const milestones = store.milestones.filter((m) => phaseIds.has(m.phase_id));
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const pendingTopics = store.topics.filter(
    (t) => milestoneIds.has(t.milestone_id) && t.status !== "completed"
  );

  const today = new Date().toISOString().split("T")[0];
  let tasksCreated = 0;

  for (let i = 0; i < Math.min(pendingTopics.length, 5); i++) {
    const topic = pendingTopics[i];
    const taskDate = new Date();
    taskDate.setDate(taskDate.getDate() + i);
    const dateStr = taskDate.toISOString().split("T")[0];

    store.dailyTasks.push({
      id: `task-rm-${Date.now()}-${i}`,
      user_id: roadmap.user_id,
      roadmap_id: roadmapId,
      learning_track_id: null,
      title: `${topic.title} (Practice & Mastery)`,
      description: `Allocated from active roadmap milestone. Estimated ${topic.estimated_hours}h focus.`,
      subject: roadmap.target_role?.includes("Frontend") ? "Frontend" : "Data Structures & Algorithms",
      estimated_minutes: Math.min(Math.round(roadmap.daily_hours * 60), 120),
      actual_minutes: null,
      priority: i === 0 ? "critical" : "high",
      status: "pending",
      scheduled_date: dateStr,
      source: "roadmap",
      source_url: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    tasksCreated++;
  }

  saveStore(store);
  revalidatePath("/roadmaps");
  revalidatePath("/dashboard");
  revalidatePath("/planner");
  return { success: true, tasksCreated };
}

export async function rebalanceRoadmapAction(roadmapId: string) {
  const store = getStore();
  const roadmap = store.roadmaps.find((r) => r.id === roadmapId);
  if (!roadmap) return { error: "Roadmap not found" };

  const phases = store.phases.filter((p) => p.roadmap_id === roadmapId);
  const phaseIds = new Set(phases.map((p) => p.id));
  const milestones = store.milestones.filter((m) => phaseIds.has(m.phase_id));
  const milestoneIds = new Set(milestones.map((m) => m.id));
  const pendingTopics = store.topics.filter(
    (t) => milestoneIds.has(t.milestone_id) && t.status !== "completed"
  );

  const today = new Date().toISOString().split("T")[0];

  // Reschedule all overdue pending tasks to start from today onwards
  const overdueTasks = store.dailyTasks.filter(
    (t) => t.roadmap_id === roadmapId && t.status === "pending" && t.scheduled_date < today
  );

  overdueTasks.forEach((t, idx) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + Math.floor(idx / 2));
    t.scheduled_date = newDate.toISOString().split("T")[0];
    t.status = "rescheduled";
  });

  saveStore(store);
  revalidatePath("/roadmaps");
  revalidatePath(`/roadmaps/${roadmapId}`);
  revalidatePath("/dashboard");
  revalidatePath("/planner");

  return {
    success: true,
    rebalancedTasks: overdueTasks.length,
    remainingTopics: pendingTopics.length,
  };
}

export async function updateTopicStatusAction(topicId: string, status: "pending" | "in_progress" | "completed") {
  const store = getStore();
  const topic = store.topics.find((t) => t.id === topicId);
  if (!topic) return { error: "Topic not found" };

  topic.status = status;

  // Recalculate roadmap progress
  const milestone = store.milestones.find((m) => m.id === topic.milestone_id);
  if (milestone) {
    const phase = store.phases.find((p) => p.id === milestone.phase_id);
    if (phase) {
      const roadmap = store.roadmaps.find((r) => r.id === phase.roadmap_id);
      if (roadmap) {
        const allPhaseIds = new Set(store.phases.filter((p) => p.roadmap_id === roadmap.id).map((p) => p.id));
        const allMilestoneIds = new Set(store.milestones.filter((m) => allPhaseIds.has(m.phase_id)).map((m) => m.id));
        const allTopics = store.topics.filter((t) => allMilestoneIds.has(t.milestone_id));
        const completedCount = allTopics.filter((t) => t.status === "completed").length;
        roadmap.completed_tasks = completedCount;
        roadmap.total_tasks = allTopics.length;
      }
    }
  }

  saveStore(store);
  revalidatePath("/roadmaps");
  return { success: true };
}
