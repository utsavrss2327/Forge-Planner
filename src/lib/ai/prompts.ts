// ============================================
// FORGE AI Prompt Templates v1
// ============================================

// ============================================
// LEARNING COACH
// ============================================

export const LEARNING_COACH_SYSTEM = `You are FORGE's Learning Coach — a patient, knowledgeable AI tutor specializing in computer science and software engineering preparation.

Your role:
- Explain concepts clearly at the student's level
- Use analogies and real-world examples
- Provide code examples when helpful
- Break complex topics into digestible parts
- Encourage deeper understanding over memorization
- Reference the student's actual preparation context when available

Guidelines:
- Be concise but thorough
- Use markdown formatting for readability
- Include code blocks with proper language tags
- Never fabricate credentials, exam results, or hiring predictions
- If you're unsure, say so honestly
- Adapt your explanation depth to the student's indicated level`;

export function explainConceptPrompt(topic: string, userLevel: string, context?: string): string {
  return `Explain the following topic for a ${userLevel}-level student preparing for SDE interviews:

Topic: ${topic}

${context ? `Student context: ${context}` : ""}

Provide:
1. A clear, intuitive explanation
2. Key concepts to remember
3. A simple code example if applicable
4. Common interview questions about this topic
5. Common mistakes to avoid`;
}

export function reviewNotesPrompt(notes: string, topic: string): string {
  return `Review these learning notes on "${topic}" and provide constructive feedback:

--- STUDENT NOTES ---
${notes}
--- END NOTES ---

Evaluate:
1. Accuracy — are there any misconceptions?
2. Completeness — what key concepts are missing?
3. Clarity — are the notes well-organized?
4. Exam readiness — would these notes help in an interview?

Provide specific suggestions for improvement.`;
}

export function answerDoubtPrompt(question: string, context?: string): string {
  return `A student preparing for SDE interviews has the following question:

"${question}"

${context ? `Context about their preparation: ${context}` : ""}

Provide a clear, helpful answer. Include code examples if relevant. If the question is ambiguous, address the most likely interpretation and note alternatives.`;
}

// ============================================
// ASSESSMENT EXAMINER
// ============================================

export const ASSESSMENT_EXAMINER_SYSTEM = `You are FORGE's Assessment Examiner — an expert at creating and evaluating technical assessments for SDE interview preparation.

Your role:
- Create challenging but fair questions based on studied material
- Test understanding, not just memorization
- Provide clear evaluation criteria
- Give constructive feedback on answers
- Identify specific knowledge gaps

Guidelines:
- Questions should cover multiple difficulty levels
- MCQs should have plausible distractors
- Coding questions should be solvable in the time allocated
- Short-answer questions should test conceptual depth
- Always provide clear correct answers and explanations
- Output valid JSON when asked for structured responses`;

export function generateAssessmentPrompt(params: {
  topics: string[];
  notes?: string;
  weaknesses?: string[];
  previousTopics?: string[];
  durationMinutes: number;
}): string {
  return `Generate a ${params.durationMinutes}-minute technical assessment based on the following:

Topics studied today: ${params.topics.join(", ")}

${params.notes ? `Student's learning notes:\n${params.notes}\n` : ""}
${params.weaknesses?.length ? `Known weak areas: ${params.weaknesses.join(", ")}` : ""}
${params.previousTopics?.length ? `Previously tested topics (avoid heavy repetition): ${params.previousTopics.join(", ")}` : ""}

Create a balanced assessment with this structure:

Section A — Concept Recall (15 minutes):
- 10 MCQ questions testing fundamental knowledge
- Each question has 4 options with exactly 1 correct answer
- Mix of easy (4), medium (4), and hard (2)

Section B — Conceptual Understanding (15 minutes):
- 3 short-answer questions requiring explanation
- Test deeper understanding, not just definitions
- Include scenario-based questions when appropriate

Section C — Practical Application (30 minutes):
- 2 coding or application questions
- If topics are theoretical (e.g., OS, Networks), use scenario/design questions instead
- Should test ability to apply concepts

Return a JSON object matching this exact structure:
{
  "title": "Assessment title",
  "description": "Brief description",
  "subjects": ["subject1"],
  "topics": ["topic1", "topic2"],
  "durationMinutes": ${params.durationMinutes},
  "totalMarks": number,
  "questions": [
    {
      "section": "concept_recall" | "conceptual_understanding" | "practical_application",
      "type": "mcq" | "short_answer" | "coding",
      "questionText": "The question",
      "options": [{"label": "A", "text": "option", "isCorrect": false}],
      "correctAnswer": "Correct answer or explanation",
      "explanation": "Why this is correct",
      "marks": number,
      "difficulty": "easy" | "medium" | "hard",
      "topic": "specific topic"
    }
  ]
}`;
}

export function evaluateAnswersPrompt(params: {
  questions: Array<{
    questionText: string;
    type: string;
    correctAnswer: string;
    marks: number;
    topic: string;
  }>;
  answers: Array<{
    questionIndex: number;
    userAnswer: string;
  }>;
}): string {
  return `Evaluate the following assessment answers:

${params.questions.map((q, i) => {
    const answer = params.answers.find((a) => a.questionIndex === i);
    return `
Question ${i + 1} [${q.type}, ${q.marks} marks, Topic: ${q.topic}]:
${q.questionText}

Expected Answer: ${q.correctAnswer}

Student's Answer: ${answer?.userAnswer || "(No answer provided)"}
`;
  }).join("\n---\n")}

For each question, evaluate:
- Is the answer correct, partially correct, or incorrect?
- What marks should be awarded (out of the available marks)?
- What feedback should be given?
- What concepts are the student missing?

Return a JSON object:
{
  "totalScore": number,
  "totalMarks": number,
  "percentage": number,
  "questionEvaluations": [
    {
      "questionIndex": number,
      "isCorrect": boolean,
      "marksAwarded": number,
      "feedback": "Specific feedback",
      "missingConcepts": ["concept1"]
    }
  ],
  "overallFeedback": "Overall assessment feedback",
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "recommendedTopics": ["topic to review"],
  "improvementSuggestions": ["suggestion1"]
}`;
}

export function growthReportPrompt(params: {
  currentScore: number;
  totalMarks: number;
  strengths: string[];
  weaknesses: string[];
  previousScores?: number[];
  topicPerformance: Record<string, { correct: number; total: number }>;
}): string {
  return `Generate an AI Growth Report for a student based on their assessment:

Current Score: ${params.currentScore}/${params.totalMarks} (${Math.round((params.currentScore / params.totalMarks) * 100)}%)

${params.previousScores?.length ? `Previous scores: ${params.previousScores.join("%, ")}%` : "First assessment"}

Strengths identified: ${params.strengths.join(", ")}
Weaknesses identified: ${params.weaknesses.join(", ")}

Topic-wise performance:
${Object.entries(params.topicPerformance).map(([topic, perf]) => `- ${topic}: ${perf.correct}/${perf.total}`).join("\n")}

Provide a growth report answering:
1. What did the student understand well?
2. What did they misunderstand?
3. Why might they have made these mistakes?
4. What should they study next?
5. How should their study plan change?

Be specific, constructive, and encouraging. Base everything on the actual data provided.`;
}

// ============================================
// ROADMAP PLANNER
// ============================================

export const ROADMAP_PLANNER_SYSTEM = `You are FORGE's Roadmap Planner — an expert at creating structured, realistic study plans for software engineering placement preparation.

Your role:
- Create achievable, well-structured roadmaps
- Break goals into phases, milestones, and topics
- Respect time constraints and daily study hours
- Account for topic dependencies and prerequisites
- Include revision and assessment time
- Balance depth and breadth

Guidelines:
- Be realistic about time estimates
- Include buffer time for unexpected delays
- Schedule harder topics when students are fresh
- Interleave revision with new learning
- Don't overload any single day
- Output valid JSON when asked for structured responses`;

export function generateRoadmapPrompt(params: {
  targetRole: string;
  targetCompanies: string[];
  durationDays: number;
  dailyHours: number;
  currentLevel: string;
  subjects: string[];
  existingKnowledge: string[];
  excludeTopics?: string[];
}): string {
  return `Create a comprehensive preparation roadmap for:

Target Role: ${params.targetRole}
Target Companies: ${params.targetCompanies.join(", ")}
Duration: ${params.durationDays} days (${Math.ceil(params.durationDays / 7)} weeks)
Daily Study Hours: ${params.dailyHours}
Current Level: ${params.currentLevel}
Subjects to cover: ${params.subjects.join(", ")}
Already knows: ${params.existingKnowledge.join(", ") || "Starting fresh"}
${params.excludeTopics?.length ? `Skip these topics: ${params.excludeTopics.join(", ")}` : ""}

Total available hours: ${params.durationDays * params.dailyHours}

Create a structured roadmap with:
- 4-6 phases (Foundation → Intermediate → Advanced → Application → Review → Interview)
- Each phase has milestones
- Each milestone has specific topics
- Each topic has an estimated hours requirement
- Topics should respect prerequisites (e.g., Arrays before Trees)
- Include revision, practice, and assessment time (at least 20% of total time)

Return JSON:
{
  "title": "Roadmap title",
  "description": "Brief description",
  "phases": [
    {
      "title": "Phase title",
      "description": "What this phase covers",
      "durationWeeks": number,
      "milestones": [
        {
          "title": "Milestone title",
          "topics": [
            {
              "title": "Topic name",
              "description": "What to learn",
              "estimatedHours": number,
              "prerequisites": ["other topic"]
            }
          ]
        }
      ]
    }
  ],
  "totalEstimatedHours": number,
  "recommendations": ["tip1", "tip2"]
}`;
}

export function parseUploadedRoadmapPrompt(text: string): string {
  return `Parse the following text into a structured roadmap. The text was extracted from a document (PDF/image) that contains a study plan or preparation roadmap.

--- EXTRACTED TEXT ---
${text}
--- END TEXT ---

Extract and organize the content into a structured format. Identify:
- Main phases or sections
- Topics within each phase
- Subtopics if mentioned
- Any time estimates mentioned

Return JSON:
{
  "title": "Identified or generated title",
  "description": "Brief description of the roadmap",
  "phases": [
    {
      "title": "Phase name",
      "topics": [
        {
          "title": "Topic name",
          "subtopics": ["subtopic1", "subtopic2"],
          "estimatedHours": number or null
        }
      ]
    }
  ]
}

If time estimates aren't provided, make reasonable estimates based on topic complexity.
If the text is unclear or doesn't seem to be a roadmap, still try to organize it logically and note any uncertainties.`;
}

export function rebalanceRoadmapPrompt(params: {
  originalPlan: string;
  completedTopics: string[];
  pendingTopics: string[];
  remainingDays: number;
  dailyHours: number;
  weakTopics: string[];
}): string {
  return `A student needs their roadmap rebalanced. They've fallen behind schedule.

Completed topics: ${params.completedTopics.join(", ")}
Pending topics: ${params.pendingTopics.join(", ")}
Remaining days: ${params.remainingDays}
Daily available hours: ${params.dailyHours}
Total remaining hours: ${params.remainingDays * params.dailyHours}
Weak topics needing extra attention: ${params.weakTopics.join(", ")}

Original plan overview:
${params.originalPlan}

Redistribute the remaining topics realistically:
1. Prioritize high-impact topics for interviews
2. Allocate extra time for weak topics
3. Don't exceed daily capacity
4. If not everything fits, suggest what to deprioritize (with reasoning)
5. Include revision time

Show any compromises needed if the timeline is too tight.`;
}

// ============================================
// PERFORMANCE ANALYST
// ============================================

export const PERFORMANCE_ANALYST_SYSTEM = `You are FORGE's Performance Analyst — an expert at analyzing student performance data and providing actionable insights.

Your role:
- Analyze assessment and learning data
- Identify patterns in strengths and weaknesses
- Track improvement over time
- Provide evidence-based recommendations
- Generate clear, motivating reports

Guidelines:
- Base all analysis on actual data provided
- Never fabricate statistics or trends
- Be constructive and encouraging
- Provide specific, actionable recommendations
- Use clear, professional language`;

export function weeklyReviewPrompt(params: {
  studyHoursPlanned: number;
  studyHoursActual: number;
  tasksCompleted: number;
  tasksTotal: number;
  assessmentsTaken: number;
  averageScore: number;
  topicsStudied: string[];
  weakTopics: string[];
  streakDays: number;
}): string {
  return `Generate a weekly performance review for a student:

Study Time: ${params.studyHoursActual}/${params.studyHoursPlanned} hours planned
Tasks: ${params.tasksCompleted}/${params.tasksTotal} completed
Assessments: ${params.assessmentsTaken} taken, avg score: ${params.averageScore}%
Topics studied: ${params.topicsStudied.join(", ")}
Weak topics: ${params.weakTopics.join(", ")}
Current streak: ${params.streakDays} days

Return a JSON review:
{
  "summary": "One paragraph overview",
  "accomplishments": ["what went well"],
  "missedGoals": ["what was missed"],
  "topicsImproved": [{"topic": "name", "improvement": "how"}],
  "persistentWeaknesses": ["topics still struggling with"],
  "nextWeekRecommendations": ["specific actions"],
  "overallScore": 1-10,
  "motivationalMessage": "Encouraging closing message"
}`;
}

export function weaknessAnalysisPrompt(params: {
  masteryData: Array<{ topic: string; subject: string; score: number; questionsCorrect: number; questionsTotal: number }>;
  recentMistakes: string[];
}): string {
  return `Analyze this student's topic-level performance:

Topic Mastery Data:
${params.masteryData.map((m) => `- ${m.subject} > ${m.topic}: ${m.score}% (${m.questionsCorrect}/${m.questionsTotal} correct)`).join("\n")}

Recent recurring mistakes:
${params.recentMistakes.join("\n")}

Return a JSON analysis:
{
  "overallAssessment": "Summary of preparation state",
  "weakTopics": [
    {
      "topic": "name",
      "subject": "parent subject",
      "currentLevel": "beginner/developing/etc",
      "specificGaps": ["what they don't understand"],
      "recommendedResources": ["what to study"],
      "estimatedTimeToImprove": "X hours"
    }
  ],
  "studyPlan": [
    {"day": 1, "focus": "topic", "tasks": ["task1"], "duration": "2h"}
  ],
  "priorityOrder": ["topic1", "topic2"]
}`;
}

export function dailyInsightPrompt(params: {
  recentActivity: string;
  upcomingDeadlines: string;
  weakAreas: string;
  streak: number;
}): string {
  return `Generate ONE brief, personalized daily insight/recommendation for a student:

Recent activity: ${params.recentActivity}
Upcoming deadlines: ${params.upcomingDeadlines}
Weak areas: ${params.weakAreas}
Current streak: ${params.streak} days

The insight should be:
- Specific and actionable
- Based on their actual data
- Encouraging but honest
- 2-3 sentences maximum

Return just the insight text, no JSON needed.`;
}
