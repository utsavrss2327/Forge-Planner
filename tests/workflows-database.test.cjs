/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { PGlite } = require("@electric-sql/pglite"),
  { randomUUID } = require("node:crypto"),
  { load } = require("./helpers.cjs");
const { generateRoutine } = load("src/lib/routine/engine.ts");
test(
  "approved routines and grounded exams persist atomically with ownership, locks, keys and deadlines enforced",
  { timeout: 60000 },
  async (t) => {
    const db = new PGlite(),
      A = randomUUID(),
      B = randomUUID();
    const query = async (sql, args = []) => (await db.query(sql, args)).rows;
    async function owner(id) {
      await db.exec("RESET ROLE");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("SET ROLE authenticated");
    }
    try {
      await db.exec(
        `CREATE ROLE authenticated NOLOGIN;CREATE ROLE anon NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}');CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA public,auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;`,
      );
      for (const file of fs
        .readdirSync("supabase/migrations")
        .filter((f) => f.endsWith(".sql"))
        .sort()) {
        await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
        if (file.startsWith("00001"))
          await db.exec(
            "GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated",
          );
      }
      await db.query("INSERT INTO auth.users(id)VALUES($1),($2)", [A, B]);
      await owner(A);
      const today = new Date().toISOString().slice(0, 10),
        topic = {
          id: randomUUID(),
          subject: "DBMS",
          title: "Transactions",
          minutes: 90,
          prerequisites: [],
          resource: "",
          completed: false,
        };
      const initial = {
        week: today,
        windows: Array.from({ length: 7 }, (_, day) => ({
          day,
          start: 540,
          end: 1080,
          capacity: 180,
        })),
        rules: [
          {
            subject: "DBMS",
            sessions: 2,
            minutes: 45,
            priority: 3,
            mandatory: true,
          },
        ],
        maxSubjects: 3,
        topics: [topic],
        sessions: [],
      };
      const generated = generateRoutine(initial, randomUUID);
      let routine;
      await t.test(
        "saving a reviewed roadmap does not activate tasks",
        async () => {
          await query("select save_reviewed_roadmap($1)", [
            { title: "Plan", topics: [topic] },
          ]);
          assert.equal(
            (await query("select count(*)::int n from daily_tasks"))[0].n,
            0,
          );
        },
      );
      await t.test(
        "invalid drafts can be saved but approval rolls back without tasks",
        async () => {
          routine = (
            await query("select save_routine(null,0,$1) r", [initial])
          )[0].r;
          await assert.rejects(
            query("select activate_routine($1,$2)", [
              routine.id,
              routine.version,
            ]),
            /coverage/,
          );
          assert.equal(
            (await query("select count(*)::int n from daily_tasks"))[0].n,
            0,
          );
        },
      );
      await t.test(
        "locked session modification, stale saves and foreign owner mutations fail",
        async () => {
          generated.sessions[0].locked = true;
          routine = (
            await query("select save_routine($1,$2,$3) r", [
              routine.id,
              routine.version,
              generated,
            ])
          )[0].r;
          const bad = structuredClone(generated);
          bad.sessions[0].start += 15;
          await assert.rejects(
            query("select save_routine($1,$2,$3)", [
              routine.id,
              routine.version,
              bad,
            ]),
            /Unlock/,
          );
          await assert.rejects(
            query("select save_routine($1,1,$2)", [routine.id, generated]),
            /Stale/,
          );
          await owner(B);
          assert.equal(
            (await query("select count(*)::int n from weekly_routines"))[0].n,
            0,
          );
          await assert.rejects(
            query("select activate_routine($1,$2)", [
              routine.id,
              routine.version,
            ]),
          );
          await owner(A);
        },
      );
      await t.test(
        "approval is atomic and repeat approval does not duplicate daily tasks",
        async () => {
          await query("select activate_routine($1,$2)", [
            routine.id,
            routine.version,
          ]);
          await query("select activate_routine($1,$2)", [
            routine.id,
            routine.version,
          ]);
          assert.equal(
            (await query("select count(*)::int n from daily_tasks"))[0].n,
            2,
          );
          assert.equal(
            (await query("select state from weekly_routines"))[0].state,
            "ACTIVE",
          );
        },
      );
      await t.test(
        "daily-task mutations respect locks and activation links, while notes stay editable",
        async () => {
          const task = (
            await query(
              "select id from daily_tasks where routine_session_id=$1",
              [generated.sessions[0].id],
            )
          )[0];
          await assert.rejects(
            query("update daily_tasks set scheduled_start=600 where id=$1", [
              task.id,
            ]),
            /Locked routine task/,
          );
          await assert.rejects(
            query("update daily_tasks set routine_id=null where id=$1", [
              task.id,
            ]),
            /Routine task links/,
          );
          await assert.rejects(
            query("delete from daily_tasks where id=$1", [task.id]),
            /Locked routine task/,
          );
          await query(
            "update daily_tasks set description='Topics for today' where id=$1",
            [task.id],
          );
          assert.equal(
            (
              await query("select description from daily_tasks where id=$1", [
                task.id,
              ])
            )[0].description,
            "Topics for today",
          );
        },
      );
      let examId;
      const questionId = randomUUID();
      await t.test(
        "only service role creates questions; answer keys never reach authenticated reads or pending exports",
        async () => {
          await assert.rejects(
            query("select persist_generated_assessment($1,$2)", [A, {}]),
            (e) => e.code === "42501",
          );
          await db.exec("RESET ROLE");
          examId = (
            await query("select persist_generated_assessment($1,$2) id", [
              A,
              {
                title: "Grounded exam",
                sources: [],
                metadata: {},
                questions: [
                  {
                    id: questionId,
                    type: "short_answer",
                    subject: "DBMS",
                    topic: "Transactions",
                    question: "Explain a lost update",
                    options: [],
                    correctAnswer: "Reference answer",
                    explanation: "Explanation",
                    marks: 4,
                    rubric: [{ criterion: "Conflict", points: 4 }],
                    sourceIds: ["video:1"],
                    minutes: 60,
                  },
                ],
              },
            ])
          )[0].id;
          await owner(A);
          await assert.rejects(
            query("select correct_answer from assessment_questions"),
            (e) => e.code === "42501",
          );
          assert.equal(
            (await query("select question_text from assessment_questions"))[0]
              .question_text,
            "Explain a lost update",
          );
          const exported = (
            await query("select export_preparation_data() d")
          )[0].d;
          assert.equal(
            exported.assessment_questions[0].correct_answer,
            undefined,
          );
          assert.equal(exported.weekly_routines.length, 1);
        },
      );
      await t.test(
        "autosave freezes on submission; repeat submit and evaluation are idempotent",
        async () => {
          await query("select start_assessment($1)", [examId]);
          await query("select save_assessment_answers($1,$2,false)", [
            examId,
            { [questionId]: "My actual reasoning" },
          ]);
          await query("select save_assessment_answers($1,$2,true)", [
            examId,
            { [questionId]: "Final reasoning" },
          ]);
          await query("select save_assessment_answers($1,$2,false)", [
            examId,
            { [questionId]: "Tampered after submission" },
          ]);
          assert.equal(
            (await query("select user_answer from assessment_answers"))[0]
              .user_answer,
            "Final reasoning",
          );
          await assert.rejects(
            query("select finalize_assessment($1,$2,$3)", [examId, A, []]),
            (e) => e.code === "42501",
          );
          await db.exec("RESET ROLE");
          const grades = [
            {
              questionId,
              marksAwarded: 1,
              isCorrect: false,
              feedback: "Missing conflict explanation",
              missingConcepts: ["Read-modify-write"],
              criteria: [],
            },
          ];
          await query("select finalize_assessment($1,$2,$3)", [
            examId,
            A,
            grades,
          ]);
          await query("select finalize_assessment($1,$2,$3)", [
            examId,
            A,
            grades,
          ]);
          await owner(A);
          assert.equal(
            (await query("select count(*)::int n from revision_items"))[0].n,
            1,
          );
          assert.equal(
            (await query("select questions_attempted from topic_mastery"))[0]
              .questions_attempted,
            1,
          );
          assert.equal(
            (await query("select user_answer from assessment_answers"))[0]
              .user_answer,
            "Final reasoning",
          );
        },
      );
      await t.test(
        "cross-user exam access is denied and reset retains other user data",
        async () => {
          await owner(B);
          assert.equal(
            (await query("select count(*)::int n from assessments"))[0].n,
            0,
          );
          await assert.rejects(query("select start_assessment($1)", [examId]));
          await query("select clear_preparation_data()");
          await owner(A);
          assert.equal(
            (await query("select count(*)::int n from assessments"))[0].n,
            1,
          );
        },
      );
      await t.test(
        "expired deadline rejects new answer contents and locks last autosave",
        async () => {
          await db.exec("RESET ROLE");
          await db.query(
            "update assessments set status='in_progress',deadline_at=now()-interval '1 second' where id=$1",
            [examId],
          );
          await owner(A);
          await query("select save_assessment_answers($1,$2,true)", [
            examId,
            { [questionId]: "Late cheating" },
          ]);
          assert.equal(
            (await query("select user_answer from assessment_answers"))[0]
              .user_answer,
            "Final reasoning",
          );
        },
      );
      await t.test(
        "anon cannot invoke any new application RPC or private validation helper",
        async () => {
          const rows = await query(
            "SELECT p.proname,has_function_privilege('anon',p.oid,'EXECUTE') allowed FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname NOT LIKE 'handle_%'",
          );
          assert.ok(rows.every((r) => !r.allowed));
        },
      );
    } finally {
      await db.close();
    }
  },
);
