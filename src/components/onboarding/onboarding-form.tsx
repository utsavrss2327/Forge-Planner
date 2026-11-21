"use client";

import { saveOnboardingAction } from "@/app/(app)/onboarding/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CAREER_ROLES,
  DAYS_OF_WEEK,
  PREPARATION_LEVELS,
  PREPARATION_SUBJECTS,
} from "@/lib/constants";
import type { Profile } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [timezone, setTimezone] = useState(profile?.timezone ?? "Asia/Kolkata");
  const [completedTopics, setCompletedTopics] = useState(
    profile?.completed_topics.join(", ") ?? "",
  );
  async function submit(form: FormData) {
    setPending(true);
    setError("");
    try {
      const result = await saveOnboardingAction(form);
      if (result.error) setError(result.error);
      else {
        router.push("/roadmaps/new");
      }
    } catch {
      setError("Preferences could not be saved. Please retry.");
    } finally {
      setPending(false);
    }
  }
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Career Profile
  const [targetRole, setTargetRole] = useState<string>(
    profile?.target_role ?? "SDE-1 / Software Engineer",
  );
  const [educationLevel, setEducationLevel] = useState(
    profile?.education_level ?? "4th Year BTech Computer Science",
  );
  const [targetDate, setTargetDate] = useState(profile?.target_date ?? "");
  const [targetCompanies, setTargetCompanies] = useState(
    profile?.target_companies.join(", ") ?? "",
  );
  const [preparationLevel, setPreparationLevel] = useState(
    profile?.preparation_level ?? "beginner",
  );

  // Step 2: Study Preferences
  const [dailyHours, setDailyHours] = useState(
    Number(profile?.daily_study_hours ?? 3),
  );
  const [availableDays, setAvailableDays] = useState<string[]>(
    profile?.available_days ?? [...DAYS_OF_WEEK],
  );
  const [studyPreference, setStudyPreference] = useState(
    profile?.study_preference ?? "structured",
  );

  // Step 3: Preparation Subjects
  const defaultSelectedSubjects = [
    "Data Structures & Algorithms",
    "Object-Oriented Programming",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "SQL",
    "System Design Fundamentals",
    "Low-Level Design",
  ];
  const [customSubject, setCustomSubject] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    profile?.preparation_subjects.length
      ? profile.preparation_subjects
      : defaultSelectedSubjects,
  );
  const [strongSubjects, setStrongSubjects] = useState<string[]>(
    profile?.strong_subjects ?? [],
  );
  const [weakSubjects, setWeakSubjects] = useState<string[]>(
    profile?.weak_subjects ?? [],
  );

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
      setStrongSubjects(strongSubjects.filter((s) => s !== subj));
      setWeakSubjects(weakSubjects.filter((s) => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const toggleStrong = (subj: string) => {
    if (strongSubjects.includes(subj)) {
      setStrongSubjects(strongSubjects.filter((s) => s !== subj));
    } else {
      setStrongSubjects([...strongSubjects, subj]);
      setWeakSubjects(weakSubjects.filter((s) => s !== subj));
    }
  };

  const toggleWeak = (subj: string) => {
    if (weakSubjects.includes(subj)) {
      setWeakSubjects(weakSubjects.filter((s) => s !== subj));
    } else {
      setWeakSubjects([...weakSubjects, subj]);
      setStrongSubjects(strongSubjects.filter((s) => s !== subj));
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
            FORGE Placement Profile Configuration
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            Build Your SDE Command Center
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Step {step} of {totalSteps} — Personalizing your daily roadmap and
            AI mentor
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface h-1.5 rounded-full mb-8 overflow-hidden border border-border">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Form Container */}
        <Card className="bg-surface border-border shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <form action={submit}>
              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded border border-primary p-3 text-sm text-primary"
                >
                  {error}
                </p>
              )}
              {step === 1 && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    Your name
                    <Input
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </label>
                  <label className="text-sm">
                    Timezone
                    <Input
                      name="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      required
                      placeholder="Asia/Kolkata"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Already completed topics (comma separated)
                    <Input
                      name="completedTopics"
                      value={completedTopics}
                      onChange={(e) => setCompletedTopics(e.target.value)}
                    />
                  </label>
                </div>
              )}
              {step !== 1 && (
                <>
                  <input type="hidden" name="fullName" value={fullName} />
                  <input type="hidden" name="timezone" value={timezone} />
                  <input
                    type="hidden"
                    name="completedTopics"
                    value={completedTopics}
                  />
                </>
              )}
              {/* Hidden Inputs for Form Submission */}
              <input type="hidden" name="targetRole" value={targetRole} />
              <input
                type="hidden"
                name="educationLevel"
                value={educationLevel}
              />
              <input type="hidden" name="targetDate" value={targetDate} />
              <input
                type="hidden"
                name="targetCompanies"
                value={targetCompanies}
              />
              <input
                type="hidden"
                name="preparationLevel"
                value={preparationLevel}
              />
              <input
                type="hidden"
                name="dailyStudyHours"
                value={dailyHours.toString()}
              />
              <input
                type="hidden"
                name="studyPreference"
                value={studyPreference}
              />
              <input
                type="hidden"
                name="availableDays"
                value={availableDays.join(",")}
              />
              <input
                type="hidden"
                name="preparationSubjects"
                value={selectedSubjects.join(",")}
              />
              <input
                type="hidden"
                name="strongSubjects"
                value={strongSubjects.join(",")}
              />
              <input
                type="hidden"
                name="weakSubjects"
                value={weakSubjects.join(",")}
              />

              {/* STEP 1: Career Profile */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Target Role & Goal
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Tell us which engineering position you are aiming for.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Target Role
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CAREER_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setTargetRole(role)}
                          className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                            targetRole === role
                              ? "bg-primary/10 border-primary text-text-primary ring-1 ring-primary"
                              : "bg-elevated border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-text-secondary">
                        Current Education / Background
                      </Label>
                      <Input
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        placeholder="e.g. 4th Year BTech CS / Recent Grad"
                        className="bg-elevated"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-text-secondary">
                        Target Placement / Interview Date
                      </Label>
                      <Input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="bg-elevated"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-text-secondary">
                      Target Companies (comma separated)
                    </Label>
                    <Input
                      value={targetCompanies}
                      onChange={(e) => setTargetCompanies(e.target.value)}
                      placeholder="Google, Amazon, Microsoft, Uber, Atlassian"
                      className="bg-elevated"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Current Preparation State
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PREPARATION_LEVELS.map((lvl) => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setPreparationLevel(lvl.value)}
                          className={`p-3 rounded-lg text-left border text-xs transition-all ${
                            preparationLevel === lvl.value
                              ? "bg-primary/10 border-primary text-text-primary"
                              : "bg-elevated border-border text-text-secondary"
                          }`}
                        >
                          <div className="font-semibold">
                            {lvl.value.toUpperCase()}
                          </div>
                          <div className="text-[11px] text-text-muted mt-1">
                            {lvl.label.split("—")[1]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Study Availability */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                      <Clock className="h-5 w-5 text-primary" />
                      Daily Commitment & Schedule
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      We never overload your schedule beyond your stated
                      capacity.
                    </p>
                  </div>

                  <div className="space-y-3 bg-elevated p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-text-primary">
                        Daily Study Time Capacity
                      </Label>
                      <Badge
                        variant="default"
                        className="text-sm px-2.5 py-0.5 font-bold"
                      >
                        {dailyHours} Hours / Day
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.5"
                      value={dailyHours}
                      onChange={(e) =>
                        setDailyHours(parseFloat(e.target.value))
                      }
                      className="w-full accent-primary cursor-pointer h-2 bg-surface rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-text-muted">
                      <span>1 hr (Working Pro)</span>
                      <span>3-4 hrs (Optimal Student)</span>
                      <span>8 hrs (Intensive Boot Camp)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Available Study Days
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const active = availableDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`p-2.5 rounded-lg border text-xs capitalize font-medium transition-all ${
                              active
                                ? "bg-primary/10 border-primary text-text-primary"
                                : "bg-elevated border-border text-text-muted opacity-60"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Study Session Structure
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStudyPreference("structured")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          studyPreference === "structured"
                            ? "bg-primary/10 border-primary text-text-primary"
                            : "bg-elevated border-border text-text-secondary"
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          Structured Curriculum
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          Strict milestone sequence, pre-calculated daily tasks,
                          dependencies.
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudyPreference("flexible")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          studyPreference === "flexible"
                            ? "bg-primary/10 border-primary text-text-primary"
                            : "bg-elevated border-border text-text-secondary"
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          Flexible Sessions
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          Choose daily modules dynamically according to
                          remaining energy.
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Subjects & Strengths */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Core SDE Curriculum & Diagnostic
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Select subjects to include, then mark your current
                      strengths and weaknesses.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-text-secondary">
                        Subjects to Include in Preparation (
                        {selectedSubjects.length} selected)
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {Array.from(
                        new Set([...PREPARATION_SUBJECTS, ...selectedSubjects]),
                      ).map((subj) => {
                        const isSelected = selectedSubjects.includes(subj);
                        return (
                          <button
                            type="button"
                            key={subj}
                            aria-pressed={selectedSubjects.includes(subj)}
                            onClick={() => toggleSubject(subj)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-elevated border-primary/40 text-text-primary"
                                : "bg-elevated/40 border-border text-text-muted"
                            }`}
                          >
                            <span className="font-medium">{subj}</span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex-1 text-sm">
                      Custom preparation subject
                      <Input
                        value={customSubject}
                        maxLength={200}
                        onChange={(e) => setCustomSubject(e.target.value)}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const subject = customSubject.trim();
                        if (subject && !selectedSubjects.includes(subject))
                          setSelectedSubjects([...selectedSubjects, subject]);
                        setCustomSubject("");
                      }}
                    >
                      Add subject
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2 bg-elevated p-3 rounded-xl border border-border">
                      <Label className="text-xs font-semibold text-success flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        Mark Existing Strengths
                      </Label>
                      <p className="text-[11px] text-text-muted">
                        We will fast-track these and emphasize hard revision
                        questions.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedSubjects.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStrong(s)}
                            className={`text-[11px] px-2 py-1 rounded-md border ${
                              strongSubjects.includes(s)
                                ? "bg-success/20 border-success text-success font-semibold"
                                : "bg-surface border-border text-text-secondary"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 bg-elevated p-3 rounded-xl border border-border">
                      <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Mark Areas Needing Improvement
                      </Label>
                      <p className="text-[11px] text-text-muted">
                        We will schedule extra practice and targeted active
                        recall for these.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedSubjects.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleWeak(s)}
                            className={`text-[11px] px-2 py-1 rounded-md border ${
                              weakSubjects.includes(s)
                                ? "bg-primary/20 border-primary text-primary font-semibold"
                                : "bg-surface border-border text-text-secondary"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Launch */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Review & Launch Your OS
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Next, create or import a roadmap, customize your routine,
                      and approve it before tasks are activated.
                    </p>
                  </div>

                  <div className="bg-elevated rounded-xl border border-border p-4 space-y-3.5">
                    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                      <span className="text-xs text-text-muted">
                        Target Career Goal
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {targetRole}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                      <span className="text-xs text-text-muted">
                        Daily Time Commitment
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {dailyHours} Hours / Day
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                      <span className="text-xs text-text-muted">
                        Target Interview Date
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {targetDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                      <span className="text-xs text-text-muted">
                        Target Companies
                      </span>
                      <span className="text-xs font-medium text-text-secondary truncate max-w-[240px]">
                        {targetCompanies}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
                      <span className="text-xs text-text-muted">
                        Active Preparation Subjects
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {selectedSubjects.length} Subjects
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted">
                        Identified Focus Weaknesses
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {weakSubjects.join(", ") || "None specified"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary leading-relaxed">
                    💡{" "}
                    <span className="text-text-primary font-semibold">
                      The FORGE Differentiator:
                    </span>{" "}
                    Your saved notes and topics can become sourced active recall
                    assessments. You review and approve routine changes before
                    activation.
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between pt-4 border-t border-border">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <Button
                    key="continue-step"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setStep(step + 1);
                    }}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    key="submit-preferences"
                    disabled={pending}
                    type="submit"
                    size="lg"
                    className="gap-2 font-bold px-8"
                  >
                    Start Your Preparation Journey
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
