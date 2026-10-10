import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import extension from "../extensions/index.ts";

const activationKeys = ["HERDR_ENV", "HERDR_PANE_ID", "HERDR_SOCKET_PATH"];
const keys = [...activationKeys, "PI_HERDR_FLOCK_STATUS"];
const original = keys.map(key => process.env[key]);
afterEach(() => keys.forEach((key, i) => {
  if (original[i] === undefined) delete process.env[key];
  else process.env[key] = original[i];
}));

function setup(exec = async () => ({ code: 0, killed: false, stdout: "live skill" }), hasUI = true) {
  Object.assign(process.env, { HERDR_ENV: "1", HERDR_PANE_ID: "caller", HERDR_SOCKET_PATH: "/socket" });
  delete process.env.PI_HERDR_FLOCK_STATUS;
  const handlers = {};
  const calls = [];
  const warnings = [];
  extension({
    on: (name, handler) => { handlers[name] = handler; },
    exec: (...args) => { calls.push(args); return exec(...args); },
  });
  const statuses = new Map();
  const ctx = { hasUI, ui: hasUI ? {
    notify: (...args) => warnings.push(args),
    setStatus: (key, text) => {
      if (text === undefined) statuses.delete(key);
      else statuses.set(key, text);
    },
  } : {
    notify: () => assert.fail("headless initialization must not notify"),
    setStatus: () => assert.fail("headless execution must not set status"),
  } };
  const start = () => handlers.session_start({}, ctx);
  const turn = (sections = {}) => {
    handlers.before_agent_start({ prompt: "ordinary request", systemPromptOptions: { sections } }, ctx);
    return sections;
  };
  return { start, turn, calls, warnings, handlers, statuses };
}

test("each missing activation variable prevents fetch and removes only owned content", async () => {
  for (const key of activationKeys) {
    const h = setup();
    delete process.env[key];
    await h.start();
    assert.deepEqual(h.turn({ pi_herdr_flock: "stale", other: "keep" }), { other: "keep" });
    assert.equal(h.calls.length, 0);
  }
  for (const [key, value] of [["HERDR_ENV", "0"], ["HERDR_PANE_ID", " "], ["HERDR_SOCKET_PATH", " "]]) {
    const h = setup();
    process.env[key] = value;
    await h.start();
    assert.equal(h.calls.length, 0);
  }
});

test("full output and policy reassert one section across turns and fresh post-compaction options", async () => {
  const stdout = "  live skill\n" + "x".repeat(20000) + "\n";
  const h = setup(async () => ({ code: 0, killed: false, stdout }));
  await h.start();
  assert.deepEqual(h.calls, [["herdr", ["--skill"], { timeout: 5000 }]]);
  const sections = h.turn({ other: "keep" });
  assert.ok(sections.pi_herdr_flock.startsWith(stdout + "\n\n"));
  for (const clause of [
    "standing request to use Herdr for otherwise-permitted Pi delegation",
    "It does not authorize delegation forbidden by the task or unrelated Herdr operations",
    "Delegate only when useful and permitted",
    "Define the required expert on demand",
    "not hidden Agent/SubagentWorkflow mechanisms",
    "Stay in the caller's workspace and working directory; preserve focus",
    "Different projects, new workspaces, and worktrees require separate authorization",
    "bounded task, expertise, context, read/edit scope, verification, completion criteria, and model/thinking choice",
    "Honor user preferences; hardcode no providers, roles, or escalation tiers",
    "Use returned surface IDs",
    "submission is not completion",
    "Inspect timeouts before retrying to avoid duplicate tasks",
    "Access failures need an available model, not identical retries",
    "Parent verifies actual results/diffs and relevant checks",
    "Avoid concurrent conflicting writes",
    "Prompt restrictions are not a sandbox",
    "Close only task-created surfaces after collecting results unless retention was requested",
    "No silent fallback to hidden workers when Herdr fails",
    "Other operations retain the live skill's consent and safety requirements",
    "Later explicit user instructions take precedence",
  ]) assert.ok(sections.pi_herdr_flock.includes(clause), `missing policy clause: ${clause}`);
  const expected = { ...sections };
  for (let i = 0; i < 3; i++) assert.deepEqual(h.turn(sections), expected);
  assert.equal(h.turn().pi_herdr_flock, expected.pi_herdr_flock);
  assert.equal(h.calls.length, 1);
  delete process.env.HERDR_ENV;
  assert.deepEqual(h.turn(sections), { other: "keep" });
});

test("invalid results and thrown missing-CLI/timeout errors omit cache and warn only at initialization", async () => {
  for (const failure of [
    { code: 1, killed: false, stdout: "bad" },
    { code: 0, killed: true, stdout: "bad" },
    { code: 0, killed: false, stdout: " \n" },
    new Error("ENOENT"), new Error("timeout"),
  ]) {
    const h = setup(async () => { if (failure instanceof Error) throw failure; return failure; });
    await h.start();
    assert.deepEqual(h.turn(), {});
    h.turn();
    assert.equal(h.warnings.length, 1);
    assert.equal(h.calls.length, 1);
  }
  const h = setup(async () => { throw new Error("missing"); }, false);
  await h.start();
  assert.equal(h.warnings.length, 0);
});

test("new initialization clears success, including while pending and on failure", async () => {
  let result = { code: 0, killed: false, stdout: "first" };
  const h = setup(async () => result);
  await h.start();
  assert.ok(h.turn().pi_herdr_flock);
  result = { code: 1, killed: false, stdout: "" };
  const pending = h.start();
  assert.deepEqual(h.turn(), {});
  await pending;
  assert.deepEqual(h.turn(), {});
  assert.equal(h.calls.length, 2);
  assert.equal(h.statuses.size, 0);
});

test("superseded successful and failed fetches cannot replace cache or warn", async () => {
  for (const rejected of [false, true]) {
    const pending = [];
    const h = setup(() => new Promise((resolve, reject) => pending.push({ resolve, reject })));
    const old = h.start();
    const latest = h.start();
    pending[1].resolve({ code: 0, killed: false, stdout: "latest" });
    await latest;
    if (rejected) pending[0].reject(new Error("late"));
    else pending[0].resolve({ code: 0, killed: false, stdout: "obsolete" });
    await old;
    assert.ok(h.turn().pi_herdr_flock.startsWith("latest\n\n"));
    assert.equal(h.warnings.length, 0);
  }
});

test("inactive initialization supersedes an outstanding fetch", async () => {
  let resolve;
  const h = setup(() => new Promise(r => { resolve = r; }));
  const old = h.start();
  delete process.env.HERDR_ENV;
  await h.start();
  resolve({ code: 0, killed: false, stdout: "obsolete" });
  await old;
  process.env.HERDR_ENV = "1";
  assert.deepEqual(h.turn(), {});
});

test("active footer status follows initialization and activation, without UI calls in headless mode", async () => {
  const h = setup();
  assert.equal(h.statuses.size, 0);
  await h.start();
  assert.equal(h.statuses.get("pi_herdr_flock"), "🐑 flock");
  process.env.PI_HERDR_FLOCK_STATUS = "custom flock";
  h.turn();
  assert.equal(h.statuses.get("pi_herdr_flock"), "custom flock");
  assert.equal(h.statuses.size, 1);
  process.env.PI_HERDR_FLOCK_STATUS = "";
  h.turn();
  assert.equal(h.statuses.get("pi_herdr_flock"), "");
  assert.ok(h.turn().pi_herdr_flock, "empty label must not disable instructions");
  delete process.env.HERDR_ENV;
  h.turn();
  assert.equal(h.statuses.size, 0);
  await h.start();
  assert.equal(h.statuses.size, 0);

  const headless = setup(undefined, false);
  await headless.start();
  headless.turn();
  assert.equal(headless.statuses.size, 0);
});
