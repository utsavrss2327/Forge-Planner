"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Clock,
  Briefcase,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CAREER_ROLES, PREPARATION_SUBJECTS, PREPARATION_LEVELS } from "@/lib/constants";
import { createRoadmapWithAIAction } from "../actions";

export default function NewRoadmapPage() {
  const [method, setMethod] = useState<"ai" | "upload" | "manual">("ai");
  const [loading, setLoading] = useState(false);

  // AI Form state
  const [targetRole, setTargetRole] = useState("SDE-1 / Software Engineer");
  const [targetCompanies, setTargetCompanies] = useState("Google, Amazon, Microsoft, Meta");
  const [durationDays, setDurationDays] = useState(90);
  const [dailyHours, setDailyHours] = useState(3.0);
  const [currentLevel, setCurrentLevel] = useState("intermediate");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "Data Structures & Algorithms",
    "DBMS",
    "Operating Systems",
    "System Design Fundamentals",
  ]);

  const toggleSubject = (s: string) => {
    if (selectedSubjects.includes(s)) {
      setSelectedSubjects(selectedSubjects.filter((x) => x !== s));
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <Link href="/roadmaps">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roadmaps
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
          Create Placement Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-text-muted">
          Transform long-term career goals into achievable daily learning and problem-solving targets.
        </p>
      </div>

      {/* 3 Methods Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setMethod("ai")}
          className={`p-4 rounded-xl border text-left transition-all ${
            method === "ai"
              ? "bg-primary/10 border-primary text-text-primary ring-1 ring-primary"
              : "bg-surface border-border text-text-secondary hover:border-border-light"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <Sparkles className="h-4 w-4 text-primary" />
            Method 1: Generate with AI
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Personalized syllabus with milestone dependencies, time boxing, and daily tasks.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMethod("upload")}
          className={`p-4 rounded-xl border text-left transition-all ${
            method === "upload"
              ? "bg-primary/10 border-primary text-text-primary ring-1 ring-primary"
              : "bg-surface border-border text-text-secondary hover:border-border-light"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <Upload className="h-4 w-4 text-primary" />
            Method 2: Upload Roadmap
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Extract syllabus from PDF syllabus sheets, PNG/JPG flowcharts, or text files.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMethod("manual")}
          className={`p-4 rounded-xl border text-left transition-all ${
            method === "manual"
              ? "bg-primary/10 border-primary text-text-primary ring-1 ring-primary"
              : "bg-surface border-border text-text-secondary hover:border-border-light"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm text-text-primary">
            <FileText className="h-4 w-4 text-primary" />
            Method 3: Write Manually
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Type or paste a custom hierarchy of phases, topics, and estimated hours.
          </p>
        </button>
      </div>

      {/* METHOD 1: AI GENERATOR */}
      {method === "ai" && (
        <Card className="bg-surface border-border">
          <CardHeader className="p-6 pb-3 border-b border-border">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Roadmap Generator
            </CardTitle>
            <p className="text-xs text-text-muted">
              Our Roadmap Planner AI agent will architect an intelligent curriculum respecting your daily capacity.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form action={createRoadmapWithAIAction} onSubmit={() => setLoading(true)} className="space-y-6">
              <input type="hidden" name="subjects" value={selectedSubjects.join(",")} />

              <div className="space-y-2">
                <Label className="text-xs text-text-secondary">Target Engineering Role</Label>
                <select
                  name="targetRole"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-10 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  {CAREER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-text-secondary">Target Placement Companies</Label>
                  <Input
                    name="targetCompanies"
                    value={targetCompanies}
                    onChange={(e) => setTargetCompanies(e.target.value)}
                    placeholder="Google, Amazon, Microsoft, Meta"
                    className="bg-elevated"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-text-secondary">Current Preparation Level</Label>
                  <select
                    name="currentLevel"
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    className="w-full h-10 rounded-md bg-elevated border border-border px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PREPARATION_LEVELS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-elevated p-4 rounded-xl border border-border">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-text-primary">Preparation Duration</Label>
                    <Badge variant="default" className="text-xs font-bold">
                      {durationDays} Days ({Math.ceil(durationDays / 30)} Months)
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[30, 60, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDurationDays(d)}
                        className={`p-2 rounded text-xs font-semibold border ${
                          durationDays === d
                            ? "bg-primary text-white border-primary"
                            : "bg-surface border-border text-text-secondary"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="durationDays" value={durationDays} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-text-primary">Daily Study Commitment</Label>
                    <Badge variant="outline" className="text-xs font-bold text-primary">
                      {dailyHours} Hours / Day
                    </Badge>
                  </div>
                  <input
                    type="range"
                    name="dailyHours"
                    min="1.0"
                    max="8.0"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-2 bg-surface rounded-lg mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>1 hr (Working)</span>
                    <span>3-4 hrs (Optimal)</span>
                    <span>8 hrs (Boot Camp)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-text-secondary">
                  Curriculum Subjects to Include ({selectedSubjects.length} selected)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PREPARATION_SUBJECTS.map((s) => {
                    const isSelected = selectedSubjects.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSubject(s)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                          isSelected
                            ? "bg-primary/20 border-primary text-text-primary"
                            : "bg-elevated border-border text-text-muted opacity-70"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" size="lg" disabled={loading} className="gap-2 font-bold px-8">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Architecting Roadmap & Generating Daily Tasks...
                    </>
                  ) : (
                    <>
                      Generate Intelligent Roadmap
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* METHOD 2: UPLOAD */}
      {method === "upload" && (
        <Card className="bg-surface border-border">
          <CardHeader className="p-6 pb-3 border-b border-border">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Roadmap Document (PDF / Image / Text)
            </CardTitle>
            <p className="text-xs text-text-muted">
              We extract topics, subtopics, and prerequisites to automatically generate your schedule.
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 hover:border-primary/50 transition-colors">
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Click to select or drag and drop your roadmap file
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Supports PDF, PNG, JPG, or TXT (Max size 10MB)
                </p>
              </div>
              <input type="file" className="hidden" id="roadmap-file-input" accept=".pdf,.png,.jpg,.jpeg,.txt" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("roadmap-file-input")?.click()}
              >
                Choose File
              </Button>
            </div>

            <form action={createRoadmapWithAIAction} className="space-y-4 pt-2">
              <input type="hidden" name="targetRole" value="Custom Extracted Roadmap" />
              <input type="hidden" name="durationDays" value="90" />
              <input type="hidden" name="dailyHours" value="3.0" />
              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  Parse & Schedule Roadmap
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* METHOD 3: MANUAL */}
      {method === "manual" && (
        <Card className="bg-surface border-border">
          <CardHeader className="p-6 pb-3 border-b border-border">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Manual Roadmap Editor
            </CardTitle>
            <p className="text-xs text-text-muted">
              Paste or type your customized preparation structure.
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Roadmap Title</Label>
              <Input placeholder="e.g. 6-Month Intensive Google SDE-1 Prep" className="bg-elevated" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-text-secondary">Syllabus Text / Topics</Label>
              <Textarea
                rows={10}
                placeholder={`Phase 1: Advanced Arrays & Strings\n- Two Pointers & Sliding Window\n- Kadane's Algorithm & Prefix Sum\n\nPhase 2: Trees & Graphs\n- Binary Tree Traversals\n- Dijkstra & Bellman-Ford\n\nPhase 3: Core CS\n- DBMS Normalization\n- Operating System Virtual Memory`}
                className="bg-elevated font-mono text-xs"
              />
            </div>

            <form action={createRoadmapWithAIAction} className="flex justify-end">
              <input type="hidden" name="targetRole" value="Custom Manual Plan" />
              <input type="hidden" name="durationDays" value="90" />
              <input type="hidden" name="dailyHours" value="3.0" />
              <Button type="submit" className="gap-2">
                Save & Build Schedule
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
