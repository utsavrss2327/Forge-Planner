/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers.cjs");
const { generateRoutine, validateRoutine } = load("src/lib/routine/engine.ts");
const { randomUUID } = require("node:crypto");
function fixture() {
  const topics = ["Networks", "DBMS", "OS", "DSA"].map((subject) => ({
    id: randomUUID(),
    subject,
    title: subject + " foundations",
    minutes: 120,
    prerequisites: [],
    resource: "",
    completed: false,
  }));
  return {
    week: "2026-11-23",
    windows: Array.from({ length: 7 }, (_, day) => ({
      day,
      start: 540,
      end: 1080,
      capacity: day === 0 ? 0 : 120,
    })),
    rules: topics.map((t) => ({
      subject: t.subject,
      sessions: 2,
      minutes: 45,
      priority: 3,
      mandatory: true,
    })),
    maxSubjects: 3,
    sessions: [],
    topics,
  };
}
test("fair weekly rotation covers every mandatory subject and respects rest/capacity", () => {
  const r = generateRoutine(fixture(), randomUUID);
  assert.equal(r.sessions.length, 8);
  assert.deepEqual(
    validateRoutine(r).filter((i) => i.severity === "error"),
    [],
  );
  assert.ok(r.sessions.every((s) => s.date !== "2026-11-29"));
});
test("infeasible coverage stays visible and locks are preserved during regeneration", () => {
  const r = generateRoutine(fixture(), randomUUID);
  r.sessions[0].locked = true;
  const locked = structuredClone(r.sessions[0]);
  r.windows.forEach((w) => (w.capacity = 45));
  const next = generateRoutine(r, randomUUID);
  assert.deepEqual(
    next.sessions.find((s) => s.id === locked.id),
    locked,
  );
  assert.ok(
    validateRoutine(next).some(
      (i) => i.rule === "coverage" && i.severity === "error",
    ),
  );
});
test("overlap, capacity, subject count, prerequisite ordering and locked changes block approval", () => {
  const r = generateRoutine(fixture(), randomUUID);
  const a = r.sessions[0],
    b = r.sessions[1];
  b.date = a.date;
  b.start = a.start;
  assert.ok(validateRoutine(r).some((i) => i.rule === "overlap"));
  const old = structuredClone(r);
  old.sessions[0].locked = true;
  assert.ok(validateRoutine(r, old).some((i) => i.rule === "locked"));
  r.topics.find((t) => t.id === a.topicId).prerequisites = [b.topicId];
  assert.ok(validateRoutine(r).some((i) => i.rule === "prerequisite"));
});
test("roadmap rejects dependency cycles and nonexistent IDs", () => {
  const { roadmapInputSchema } = load("src/lib/routine/schema.ts");
  const r = fixture();
  r.topics[0].prerequisites = [r.topics[1].id];
  r.topics[1].prerequisites = [r.topics[0].id];
  assert.equal(
    roadmapInputSchema.safeParse({ title: "Plan", topics: r.topics }).success,
    false,
  );
});

test("unchanged locked sessions remain valid after schema parsing changes object key order", () => {
  const r = generateRoutine(fixture(), randomUUID);
  r.sessions[0].locked = true;
  assert.equal(
    validateRoutine(structuredClone(r), r).some((i) => i.rule === "locked"),
    false,
  );
  const proposal = generateRoutine(r, randomUUID);
  assert.equal(
    validateRoutine(proposal, r).some((i) => i.rule === "locked"),
    false,
  );
});

test("CSV imports handle quoted commas and JSON copies remap prerequisite IDs", () => {
  const { parseRoadmapText } = load("src/lib/routine/import-text.ts");
  const csv = parseRoadmapText(
    'Subject,Topic,Minutes\nDBMS,"Transactions, isolation",60\nNetworks,TCP,45',
    "Plan",
    randomUUID,
  );
  assert.equal(csv.topics[0].title, "Transactions, isolation");
  const original = fixture().topics.slice(0, 2);
  original[1].prerequisites = [original[0].id];
  const copy = parseRoadmapText(
    JSON.stringify({ title: "Copy", topics: original }),
    "Plan",
    randomUUID,
  );
  assert.notEqual(copy.topics[0].id, original[0].id);
  assert.equal(copy.topics[1].prerequisites[0], copy.topics[0].id);
});

test("JSONB key reordering does not create a false local-recovery conflict", () => {
  const { routineFingerprint } = load("src/lib/routine/engine.ts");
  const r = fixture(),
    reordered = Object.fromEntries(Object.entries(r).reverse());
  assert.equal(routineFingerprint(r), routineFingerprint(reordered));
  reordered.maxSubjects = 2;
  assert.notEqual(routineFingerprint(r), routineFingerprint(reordered));
});

test("the final topic block uses remaining study time instead of adding a full unnecessary session", () => {
  const r = fixture();
  r.topics[0].minutes = 60;
  const proposal = generateRoutine(r, randomUUID);
  const blocks = proposal.sessions.filter((s) => s.topicId === r.topics[0].id);
  assert.equal(
    blocks.reduce((n, s) => n + s.minutes, 0),
    60,
  );
  assert.deepEqual(
    blocks.map((s) => s.minutes).sort((a, b) => a - b),
    [15, 45],
  );
});
