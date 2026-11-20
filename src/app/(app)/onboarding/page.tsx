import { readProfile } from "@/lib/storage/profile";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
export default async function OnboardingPage() { return <OnboardingForm profile={await readProfile()} />; }
