import { notFound } from "next/navigation";
import { getAssessmentByIdAction } from "../actions";
import { TestRunnerClient } from "./test-runner-client";

export const dynamic = "force-dynamic";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { id } = await params;
  const data = await getAssessmentByIdAction(id);

  if (!data) notFound();

  return (
    <div className="pb-12">
      <TestRunnerClient
        assessment={data.assessment}
        questions={data.questions}
      />
    </div>
  );
}
