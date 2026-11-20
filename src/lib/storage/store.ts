import fs from "fs";
import path from "path";
import type {
  Profile,
  StudySession,
  Roadmap,
  RoadmapPhase,
  RoadmapMilestone,
  RoadmapTopic,
  DailyTask,
  LearningTrack,
  YoutubePlaylist,
  PlaylistVideo,
  JournalEntry,
  Assessment,
  AssessmentQuestion,
  AssessmentAnswer,
  DSAProblem,
  RevisionItem,
  JobApplication,
  TopicMastery,
  AIConversation,
  ActivityLog,
  Notification,
} from "@/types";

interface ForgeStoreData {
  profiles: Record<string, Profile>;
  studySessions: StudySession[];
  roadmaps: Roadmap[];
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
  topics: RoadmapTopic[];
  dailyTasks: DailyTask[];
  learningTracks: LearningTrack[];
  youtubePlaylists: YoutubePlaylist[];
  playlistVideos: PlaylistVideo[];
  journalEntries: JournalEntry[];
  assessments: Assessment[];
  assessmentQuestions: AssessmentQuestion[];
  assessmentAnswers: AssessmentAnswer[];
  dsaProblems: DSAProblem[];
  revisionItems: RevisionItem[];
  jobApplications: JobApplication[];
  topicMastery: TopicMastery[];
  aiConversations: AIConversation[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
}

const DATA_DIR = process.env.FORGE_DATA_DIR || path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

function getInitialStore(): ForgeStoreData {
  const today = new Date().toISOString().split("T")[0];

  const defaultProfile: Profile = {
    id: DEFAULT_USER_ID,
    full_name: "Rahul Sharma",
    avatar_url: null,
    target_role: "SDE-1 / Software Engineer",
    education_level: "4th Year BTech Computer Science",
    target_date: "2025-06-30",
    target_companies: ["Google", "Amazon", "Microsoft", "Meta", "Uber"],
    preparation_level: "intermediate",
    daily_study_hours: 3.0,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    strong_subjects: ["Data Structures & Algorithms", "Object-Oriented Programming"],
    weak_subjects: ["Dynamic Programming", "Computer Networks", "DBMS"],
    completed_topics: ["Arrays", "Binary Search", "Linked Lists"],
    study_preference: "structured",
    preparation_subjects: [
      "Data Structures & Algorithms",
      "DBMS",
      "Operating Systems",
      "Computer Networks",
      "System Design Fundamentals",
      "Low-Level Design",
    ],
    onboarding_completed: true,
    timezone: "Asia/Kolkata",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const initialRoadmapId = "roadmap-sde1-core";
  const initialRoadmap: Roadmap = {
    id: initialRoadmapId,
    user_id: DEFAULT_USER_ID,
    title: "SDE-1 Comprehensive Placement Blueprint (365 Days)",
    description: "Structured curriculum covering Advanced DSA, Core CS Subjects, LLD, and Mock Interviews.",
    target_role: "SDE-1 / Software Engineer",
    duration_days: 365,
    start_date: today,
    end_date: "2025-11-20",
    daily_hours: 3.0,
    status: "active",
    source: "ai",
    total_tasks: 48,
    completed_tasks: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const phase1Id = "phase-dsa-foundations";
  const phase2Id = "phase-adv-dsa";
  const phase3Id = "phase-core-cs";
  const phase4Id = "phase-sys-design";

  const initialPhases: RoadmapPhase[] = [
    {
      id: phase1Id,
      roadmap_id: initialRoadmapId,
      title: "Phase 1: Advanced DSA & Problem Solving Patterns",
      description: "Master Two Pointers, Sliding Window, Trees, and Dynamic Programming.",
      order_index: 0,
      start_date: today,
      end_date: "2025-02-28",
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
    {
      id: phase2Id,
      roadmap_id: initialRoadmapId,
      title: "Phase 2: Complex Graphs & Dynamic Programming",
      description: "Dijkstra, Bellman-Ford, DP on Trees, Matrix Exponentiation.",
      order_index: 1,
      start_date: "2025-03-01",
      end_date: "2025-05-31",
      status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: phase3Id,
      roadmap_id: initialRoadmapId,
      title: "Phase 3: Core Computer Science Fundamentals",
      description: "OS (Virtual Memory, Concurrency), DBMS (Indexing, Transactions), Networks (TCP/IP).",
      order_index: 2,
      start_date: "2025-06-01",
      end_date: "2025-08-31",
      status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: phase4Id,
      roadmap_id: initialRoadmapId,
      title: "Phase 4: Low-Level Design & Behavioral Preparation",
      description: "SOLID Principles, Design Patterns, STAR methodology behavioral mocks.",
      order_index: 3,
      start_date: "2025-09-01",
      end_date: "2025-11-20",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const m1Id = "milestone-arrays-strings";
  const m2Id = "milestone-trees-bst";
  const initialMilestones: RoadmapMilestone[] = [
    {
      id: m1Id,
      phase_id: phase1Id,
      title: "Arrays, Two Pointers & Binary Search",
      description: "Fundamental patterns tested in Amazon and Google screenings.",
      order_index: 0,
      target_date: today,
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
    {
      id: m2Id,
      phase_id: phase1Id,
      title: "Binary Trees & BST Traversals",
      description: "LCA, Boundary Traversal, View problems, and BST validation.",
      order_index: 1,
      target_date: "2025-02-15",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const initialTopics: RoadmapTopic[] = [
    {
      id: "topic-binary-search",
      milestone_id: m1Id,
      title: "Binary Search on Answer Space",
      description: "Koko Eating Bananas, Aggressive Cows, Book Allocation Problem.",
      order_index: 0,
      estimated_hours: 4.5,
      status: "completed",
      created_at: new Date().toISOString(),
    },
    {
      id: "topic-sliding-window",
      milestone_id: m1Id,
      title: "Variable Size Sliding Window & Hash Maps",
      description: "Longest Substring Without Repeating Characters, Minimum Window Substring.",
      order_index: 1,
      estimated_hours: 5.0,
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
  ];

  const initialTasks: DailyTask[] = [
    {
      id: "task-1",
      user_id: DEFAULT_USER_ID,
      roadmap_id: initialRoadmapId,
      learning_track_id: null,
      title: "Sliding Window Maximum (LeetCode 239) & Monotonic Queue",
      description: "Implement deque approach in O(N) time and analyze auxiliary space complexity.",
      subject: "Data Structures & Algorithms",
      estimated_minutes: 50,
      actual_minutes: null,
      priority: "high",
      status: "in_progress",
      scheduled_date: today,
      source: "roadmap",
      source_url: "https://leetcode.com/problems/sliding-window-maximum/",
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "task-2",
      user_id: DEFAULT_USER_ID,
      roadmap_id: initialRoadmapId,
      learning_track_id: null,
      title: "Watch Striver A2Z DSA: Binary Search in 2D Matrix",
      description: "Take notes on search space reduction and edge cases with row-major indices.",
      subject: "Data Structures & Algorithms",
      estimated_minutes: 40,
      actual_minutes: 45,
      priority: "medium",
      status: "completed",
      scheduled_date: today,
      source: "roadmap",
      source_url: null,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "task-3",
      user_id: DEFAULT_USER_ID,
      roadmap_id: null,
      learning_track_id: null,
      title: "Revise DBMS Normalization (1NF through BCNF)",
      description: "Write out functional dependency losslessness and dependency preservation checks.",
      subject: "DBMS",
      estimated_minutes: 30,
      actual_minutes: null,
      priority: "high",
      status: "pending",
      scheduled_date: today,
      source: "revision",
      source_url: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "task-4",
      user_id: DEFAULT_USER_ID,
      roadmap_id: null,
      learning_track_id: null,
      title: "Daily Active Recall: 60-Minute Assessment",
      description: "Test your retention on Binary Search and DBMS Normalization studied today.",
      subject: "Assessments",
      estimated_minutes: 60,
      actual_minutes: null,
      priority: "critical",
      status: "pending",
      scheduled_date: today,
      source: "ai",
      source_url: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialTrackId = "track-striver-dsa";
  const initialTracks: LearningTrack[] = [
    {
      id: initialTrackId,
      user_id: DEFAULT_USER_ID,
      title: "Striver A2Z DSA Course — Master SDE Placement",
      description: "Step-by-step master playlist covering foundational to advanced interview DSA.",
      subject: "Data Structures & Algorithms",
      target_outcome: "Solve 450+ high-frequency interview questions with clean code",
      start_date: today,
      deadline: "2025-05-30",
      priority: "critical",
      daily_goal: "2 video lectures + 3 coding problems",
      weekly_goal: "Complete 1 full topic module + 1 assessment",
      resource_links: [
        "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        "https://leetcode.com/problemset/all/",
      ],
      status: "active",
      notes: "Focus heavily on edge cases, space complexities, and dry runs on whiteboard.",
      total_items: 45,
      completed_items: 14,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "track-dbms-gate",
      user_id: DEFAULT_USER_ID,
      title: "DBMS & SQL Deep Dive for SDE Interviews",
      description: "ACID properties, indexing (B+ Trees), concurrency control, and query optimization.",
      subject: "DBMS",
      target_outcome: "Flawless answers on transactions, locks, and complex JOIN queries",
      start_date: today,
      deadline: "2025-04-15",
      priority: "high",
      daily_goal: "1 concept chapter + 2 SQL queries",
      weekly_goal: "Revise normalization and practice query optimization",
      resource_links: [],
      status: "active",
      notes: null,
      total_items: 20,
      completed_items: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialPlaylistId = "playlist-a2z-dsa";
  const initialPlaylists: YoutubePlaylist[] = [
    {
      id: initialPlaylistId,
      user_id: DEFAULT_USER_ID,
      learning_track_id: initialTrackId,
      playlist_id: "PLgUwDviBIf0oF6QL8m22w1hZctH45dyoQ",
      title: "Striver's A2Z DSA Playlist — Algorithms & Data Structures",
      description: "Complete DSA playlist for product-based company interview rounds.",
      thumbnail_url: "https://images.unsplash.com/photo-1516116211227-bbc831c26027?w=500&auto=format&fit=crop&q=60",
      total_videos: 40,
      completed_videos: 14,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialVideos: PlaylistVideo[] = [
    {
      id: "vid-1",
      playlist_id: initialPlaylistId,
      video_id: "0bHzKL4Vd98",
      title: "Binary Search 101: Understanding Search Space & Termination Conditions",
      thumbnail_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60",
      duration_seconds: 1680,
      order_index: 0,
      status: "completed",
      difficulty_rating: 2,
      topics_learned: ["Binary Search", "Loop Invariants", "Integer Overflow Protection"],
      notes: "Always compute mid = low + (high - low) / 2 to avoid overflow. The condition `low <= high` keeps search space valid when elements can be at boundaries.",
      last_studied_at: today,
      completed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "vid-2",
      playlist_id: initialPlaylistId,
      video_id: "W9QJ8HaSXX8",
      title: "Binary Search on Answer: Aggressive Cows & Capacity To Ship Packages",
      thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60",
      duration_seconds: 2240,
      order_index: 1,
      status: "completed",
      difficulty_rating: 4,
      topics_learned: ["Binary Search on Answers", "Monotonicity", "Feasibility Checkers"],
      notes: "When looking for the minimum of maximums (or vice-versa), identify if a feasibility function f(x) is monotonic: true true true false false. Then binary search the threshold.",
      last_studied_at: today,
      completed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "vid-3",
      playlist_id: initialPlaylistId,
      video_id: "Q2Vp1Zp1R4k",
      title: "Search in Rotated Sorted Array I & II (Handling Duplicates)",
      thumbnail_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60",
      duration_seconds: 1920,
      order_index: 2,
      status: "in_progress",
      difficulty_rating: 3,
      topics_learned: ["Rotated Sorted Arrays", "Pivot Finding", "Duplicate Ambiguity"],
      notes: "At least one half is always sorted! Identify which half is sorted by checking nums[low] <= nums[mid].",
      last_studied_at: today,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialJournals: JournalEntry[] = [
    {
      id: "journal-1",
      user_id: DEFAULT_USER_ID,
      learning_track_id: initialTrackId,
      date: today,
      summary: "Completed Binary Search in Rotated Arrays and reviewed DBMS Functional Dependencies and BCNF.",
      concepts: [
        "Binary Search on monotonic predicates",
        "Rotated sorted arrays: identifying sorted half",
        "Lossless join decomposition",
        "BCNF vs 3NF trade-off: dependency preservation",
      ],
      code_snippets: [
        {
          language: "cpp",
          code: `int low = 0, high = n - 1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (nums[mid] == target) return mid;\n    if (nums[low] <= nums[mid]) {\n        if (nums[low] <= target && target < nums[mid]) high = mid - 1;\n        else low = mid + 1;\n    } else {\n        if (nums[mid] < target && target <= nums[high]) low = mid + 1;\n        else high = mid - 1;\n    }\n}\nreturn -1;`,
          description: "Standard search in rotated sorted array without duplicates.",
        },
      ],
      confusing_topics: ["Dependency preservation in BCNF", "Handling duplicates in rotated binary search"],
      questions: ["Why can 3NF guarantee dependency preservation while BCNF cannot?"],
      resource_links: ["https://leetcode.com/problems/search-in-rotated-sorted-array/"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialDsaProblems: DSAProblem[] = [
    {
      id: "prob-1",
      user_id: DEFAULT_USER_ID,
      name: "Trapping Rain Water",
      url: "https://leetcode.com/problems/trapping-rain-water/",
      platform: "leetcode",
      topic: "Two Pointers",
      difficulty: "hard",
      status: "solved",
      attempts: 2,
      time_taken_minutes: 35,
      date_solved: today,
      solution_notes: "Two pointer approach tracking left_max and right_max in O(N) time and O(1) space.",
      mistakes: "Initially tried monotonic stack and made index off-by-one errors with width.",
      needs_revision: true,
      last_attempted_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prob-2",
      user_id: DEFAULT_USER_ID,
      name: "LRU Cache",
      url: "https://leetcode.com/problems/lru-cache/",
      platform: "leetcode",
      topic: "Design",
      difficulty: "medium",
      status: "solved",
      attempts: 1,
      time_taken_minutes: 25,
      date_solved: today,
      solution_notes: "Doubly Linked List + Hash Map pointing to nodes for O(1) get and put.",
      mistakes: null,
      needs_revision: false,
      last_attempted_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prob-3",
      user_id: DEFAULT_USER_ID,
      name: "Coin Change (Min Coins)",
      url: "https://leetcode.com/problems/coin-change/",
      platform: "leetcode",
      topic: "Dynamic Programming",
      difficulty: "medium",
      status: "attempted",
      attempts: 3,
      time_taken_minutes: 45,
      date_solved: null,
      solution_notes: "Unbounded knapsack style DP. dp[i] = min(dp[i], 1 + dp[i - coin]).",
      mistakes: "Failed to initialize array with amount + 1 or INT_MAX, caused integer overflow with 1 + dp[x].",
      needs_revision: true,
      last_attempted_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialRevisionItems: RevisionItem[] = [
    {
      id: "rev-1",
      user_id: DEFAULT_USER_ID,
      subject: "Data Structures & Algorithms",
      topic: "Dynamic Programming: Unbounded Knapsack",
      content: "Explain the space-optimized 1D array transition for Coin Change vs 0/1 Knapsack.",
      item_type: "flashcard",
      next_review_date: today,
      interval_days: 1,
      ease_factor: 2.3,
      repetitions: 1,
      last_quality: 4,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "rev-2",
      user_id: DEFAULT_USER_ID,
      subject: "DBMS",
      topic: "Transactions & Concurrency Control",
      content: "What is Two-Phase Locking (2PL) and how does Strict 2PL prevent cascading aborts?",
      item_type: "concept",
      next_review_date: today,
      interval_days: 3,
      ease_factor: 2.5,
      repetitions: 2,
      last_quality: 5,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialApplications: JobApplication[] = [
    {
      id: "app-1",
      user_id: DEFAULT_USER_ID,
      company: "Google",
      role: "Software Engineer (Early Career / Campus)",
      location: "Bengaluru / Hyderabad, India",
      job_url: "https://careers.google.com/jobs/results/",
      application_date: "2024-11-01",
      deadline: "2024-12-15",
      status: "online_assessment",
      referral_status: "Referred by Senior SWE",
      resume_version: "v4_swe_systems.pdf",
      interview_rounds: [
        { round_number: 1, type: "OA Snapshot", date: "2024-11-10", notes: "2 DSA algorithmic problems." },
        { round_number: 2, type: "Technical Screen 1", date: "2024-12-05", notes: "Data structures & graphs." },
      ],
      notes: "Focus intensely on graph traversals, topological sort, and time/space complexity justification.",
      follow_up_date: "2024-12-02",
      salary_range: "₹28L - ₹38L CTC",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "app-2",
      user_id: DEFAULT_USER_ID,
      company: "Amazon",
      role: "SDE-1 (6-Month Intern + FTE)",
      location: "Bengaluru, India",
      job_url: "https://amazon.jobs",
      application_date: "2024-10-25",
      deadline: "2024-12-20",
      status: "interview_scheduled",
      referral_status: "Direct Portal",
      resume_version: "v4_swe_backend.pdf",
      interview_rounds: [
        { round_number: 1, type: "OA 1 (Debugging & Code)", date: "2024-11-04" },
        { round_number: 2, type: "OA 2 (Work Style Assessment)", date: "2024-11-04" },
        { round_number: 3, type: "Final Virtual Loop (3 Rounds)", date: "2024-12-12" },
      ],
      notes: "Need 2 STAR stories prepared for each Amazon Leadership Principle (Bias for Action, Customer Obsession).",
      follow_up_date: "2024-12-10",
      salary_range: "₹24L - ₹32L CTC",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "app-3",
      user_id: DEFAULT_USER_ID,
      company: "Microsoft",
      role: "Software Engineer",
      location: "Hyderabad / Noida",
      job_url: null,
      deadline: null,
      application_date: "2024-11-15",
      status: "applied",
      referral_status: "Pending referral",
      resume_version: "v4_swe_general.pdf",
      interview_rounds: [],
      notes: "Codility assessment anticipated within 2 weeks.",
      follow_up_date: null,
      salary_range: "₹22L - ₹30L CTC",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialMastery: TopicMastery[] = [
    {
      id: "mast-1",
      user_id: DEFAULT_USER_ID,
      subject: "Data Structures & Algorithms",
      topic: "Arrays & Two Pointers",
      mastery_level: "strong",
      score: 88,
      questions_attempted: 25,
      questions_correct: 22,
      last_assessed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mast-2",
      user_id: DEFAULT_USER_ID,
      subject: "Data Structures & Algorithms",
      topic: "Binary Search",
      mastery_level: "strong",
      score: 82,
      questions_attempted: 18,
      questions_correct: 15,
      last_assessed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mast-3",
      user_id: DEFAULT_USER_ID,
      subject: "Data Structures & Algorithms",
      topic: "Dynamic Programming",
      mastery_level: "developing",
      score: 48,
      questions_attempted: 20,
      questions_correct: 9,
      last_assessed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mast-4",
      user_id: DEFAULT_USER_ID,
      subject: "DBMS",
      topic: "Normalization & SQL",
      mastery_level: "proficient",
      score: 72,
      questions_attempted: 15,
      questions_correct: 11,
      last_assessed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialAssessmentId = "eval-sample-1";
  const initialAssessments: Assessment[] = [
    {
      id: initialAssessmentId,
      user_id: DEFAULT_USER_ID,
      title: "Daily Active Recall: Binary Search & Normalization Benchmark",
      description: "60-minute test evaluating today's concepts and identifying reasoning gaps.",
      subjects: ["Data Structures & Algorithms", "DBMS"],
      topics: ["Binary Search", "Rotated Arrays", "BCNF & 3NF"],
      duration_minutes: 60,
      total_questions: 15,
      total_marks: 30,
      status: "evaluated",
      started_at: today,
      submitted_at: today,
      time_spent_seconds: 3120,
      score: 24.5,
      percentage: 81.67,
      ai_feedback: "Demonstrated rock-solid intuition for binary search boundary conditions. Minor weakness in dependency preservation proofs for BCNF decompositions.",
      strengths: [
        "Binary Search on answer space monotonicity",
        "Edge case handling in rotated arrays",
        "Lossless join validation",
      ],
      weaknesses: [
        "Functional dependency preservation under BCNF",
        "Unbounded knapsack transition states",
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const initialLogs: ActivityLog[] = [
    {
      id: "log-1",
      user_id: DEFAULT_USER_ID,
      activity_type: "video_completed",
      activity_date: today,
      count: 2,
      metadata: { track: "Striver A2Z DSA" },
      created_at: new Date().toISOString(),
    },
    {
      id: "log-2",
      user_id: DEFAULT_USER_ID,
      activity_type: "problem_solved",
      activity_date: today,
      count: 2,
      metadata: { problems: ["Trapping Rain Water", "LRU Cache"] },
      created_at: new Date().toISOString(),
    },
    {
      id: "log-3",
      user_id: DEFAULT_USER_ID,
      activity_type: "assessment_completed",
      activity_date: today,
      count: 1,
      metadata: { score: 81.67 },
      created_at: new Date().toISOString(),
    },
  ];

  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    initialLogs.push({
      id: `log-seed-${i}`,
      user_id: DEFAULT_USER_ID,
      activity_type: "study_session",
      activity_date: dateStr,
      count: Math.floor(Math.random() * 4) + 1,
      metadata: { simulated: true },
      created_at: new Date().toISOString(),
    });
  }

  return {
    studySessions: [],
    profiles: {
      [DEFAULT_USER_ID]: defaultProfile,
    },
    roadmaps: [initialRoadmap],
    phases: initialPhases,
    milestones: initialMilestones,
    topics: initialTopics,
    dailyTasks: initialTasks,
    learningTracks: initialTracks,
    youtubePlaylists: initialPlaylists,
    playlistVideos: initialVideos,
    journalEntries: initialJournals,
    assessments: initialAssessments,
    assessmentQuestions: [],
    assessmentAnswers: [],
    dsaProblems: initialDsaProblems,
    revisionItems: initialRevisionItems,
    jobApplications: initialApplications,
    topicMastery: initialMastery,
    aiConversations: [],
    activityLogs: initialLogs,
    notifications: [
      {
        id: "notif-1",
        user_id: DEFAULT_USER_ID,
        title: "Upcoming Google Technical Screen",
        message: "Your Technical Screen 1 is in 3 days. Focus on Graph traversals and Tree LCA.",
        type: "reminder",
        read: false,
        action_url: "/applications",
        created_at: new Date().toISOString(),
      },
      {
        id: "notif-2",
        user_id: DEFAULT_USER_ID,
        title: "Streak Record: 5 Days!",
        message: "You've maintained your 3-hour study streak for 5 consecutive days.",
        type: "achievement",
        read: false,
        action_url: "/dashboard",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

export function getStore(): ForgeStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content) as ForgeStoreData;
    parsed.studySessions ??= [];
    return parsed;
  } catch (err) {
    console.error("Error reading store from disk:", err);
    throw new Error("Local learning data could not be read. Restore the store before continuing.");
  }
}

export function saveStore(store: ForgeStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const temporary = `${STORE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(store, null, 2), "utf-8");
    fs.renameSync(temporary, STORE_FILE);
  } catch (err) {
    console.error("Error saving store to disk:", err);
    throw new Error("Local learning data could not be saved. Please retry.");
  }
}

export function getProfile(userId = DEFAULT_USER_ID): Profile | null {
  const store = getStore();
  return store.profiles[userId] || store.profiles[DEFAULT_USER_ID] || null;
}

export function saveProfile(profile: Partial<Profile> & { id: string }): Profile {
  const store = getStore();
  const existing = store.profiles[profile.id] || store.profiles[DEFAULT_USER_ID] || {};
  const updated: Profile = {
    ...existing,
    ...profile,
    updated_at: new Date().toISOString(),
  } as Profile;
  store.profiles[profile.id] = updated;
  saveStore(store);
  return updated;
}
