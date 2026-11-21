export const maxDuration = 120;
import { ExamRunner } from "@/components/assessment/runner";
import { notFound, redirect } from "next/navigation";
import { getAssessmentByIdAction } from "../actions";
export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    data = await getAssessmentByIdAction(id);
  if (!data) notFound();
  if (data.assessment.status === "evaluated")
    redirect(`/assessments/${id}/results`);
  return (
    <ExamRunner
      id={id}
      title={data.assessment.title}
      state={data.assessment.status}
      deadline={data.assessment.deadline_at}
      questions={data.questions}
      savedAnswers={Object.fromEntries(
        data.answers.map((a) => [a.question_id, a.user_answer]),
      )}
    />
  );
}
