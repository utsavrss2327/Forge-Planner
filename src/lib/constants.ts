export const APP_NAME = "FORGE";
export const APP_DESCRIPTION = "AI-Powered SDE Placement OS";

export const CAREER_ROLES = [
  "SDE-1 / Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "DevOps / Cloud Engineer",
  "Custom",
] as const;

export const PREPARATION_SUBJECTS = [
  "Data Structures & Algorithms",
  "Object-Oriented Programming",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "SQL",
  "Low-Level Design",
  "System Design Fundamentals",
  "Java",
  "C++",
  "Python",
  "JavaScript",
  "Development Projects",
  "Git & GitHub",
  "Resume Preparation",
  "Online Assessments",
  "Behavioral Interviews",
] as const;

export const PREPARATION_LEVELS = [
  { value: "beginner", label: "Beginner — Just starting" },
  { value: "intermediate", label: "Intermediate — Some preparation done" },
  { value: "advanced", label: "Advanced — Mostly prepared, need fine-tuning" },
] as const;

export const DAYS_OF_WEEK = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export const DSA_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks", "Queues",
  "Hash Maps", "Trees", "Binary Search Trees", "Heaps",
  "Graphs", "Dynamic Programming", "Greedy", "Backtracking",
  "Bit Manipulation", "Math", "Sorting", "Binary Search",
  "Two Pointers", "Sliding Window", "Recursion", "Tries",
  "Segment Trees", "Disjoint Set",
] as const;

export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const APPLICATION_STATUSES = [
  "saved", "applied", "online_assessment", "interview_scheduled",
  "interviewing", "offer", "rejected", "withdrawn",
] as const;

export const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "My Roadmaps", href: "/roadmaps", icon: "Map" },
  { name: "Daily Planner", href: "/planner", icon: "CalendarDays" },
  { name: "Learning Hub", href: "/learning", icon: "BookOpen" },
  { name: "AI Assessment Lab", href: "/assessments", icon: "FlaskConical" },
  { name: "DSA Practice", href: "/dsa", icon: "Code2" },
  { name: "Revision Center", href: "/revision", icon: "RotateCcw" },
  { name: "Analytics", href: "/analytics", icon: "BarChart3" },
  { name: "Job Applications", href: "/applications", icon: "Briefcase" },
  { name: "AI Mentor", href: "/mentor", icon: "Bot" },
  { name: "Settings", href: "/settings", icon: "Settings" },
] as const;
