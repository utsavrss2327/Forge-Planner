"use server";

import { revalidatePath } from "next/cache";
import { getStore, saveStore } from "@/lib/storage/store";
import type { JobApplication, ApplicationStatus } from "@/types";

export async function getApplicationsAction() {
  const store = getStore();
  return {
    applications: store.jobApplications,
  };
}

export async function createApplicationAction(formData: FormData) {
  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const location = formData.get("location") as string;
  const jobUrl = formData.get("jobUrl") as string;
  const status = (formData.get("status") as ApplicationStatus) || "saved";
  const referralStatus = formData.get("referralStatus") as string;
  const resumeVersion = formData.get("resumeVersion") as string;
  const deadline = formData.get("deadline") as string;
  const salaryRange = formData.get("salaryRange") as string;
  const notes = formData.get("notes") as string;

  if (!company || !role) {
    return { error: "Company and Role are required" };
  }

  const store = getStore();
  const userId = "00000000-0000-0000-0000-000000000001";
  const today = new Date().toISOString().split("T")[0];

  const newApp: JobApplication = {
    id: `app-${Date.now()}`,
    user_id: userId,
    company,
    role,
    location: location || null,
    job_url: jobUrl || null,
    application_date: today,
    deadline: deadline || null,
    status,
    referral_status: referralStatus || null,
    resume_version: resumeVersion || null,
    interview_rounds: [],
    notes: notes || null,
    follow_up_date: null,
    salary_range: salaryRange || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.jobApplications.unshift(newApp);
  saveStore(store);

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateApplicationStatusAction(appId: string, status: ApplicationStatus) {
  const store = getStore();
  const app = store.jobApplications.find((a) => a.id === appId);
  if (!app) return { error: "Application not found" };

  app.status = status;
  app.updated_at = new Date().toISOString();

  saveStore(store);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}
