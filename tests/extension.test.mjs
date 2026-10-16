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
  return { start, turn, calls, warnings, handlers, statuses, ctx };
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
    "standing request to prefer visible Pi workers through Herdr",
    "when delegation is useful and permitted",
    "Flock does not launch workers itself",
    "Follow the user's instructions",
    "Default to the current project and Herdr workspace",
    "preserve the user's focus",
    "Follow the live Herdr skill",
    "Honor requested models and thinking levels",
    "do not silently fall back to hidden workers",
    "Herdr's own safety and permission rules still apply",
  ]) assert.ok(sections.pi_herdr_flock.includes(clause), `missing policy clause: ${clause}`);
  assert.ok(!sections.pi_herdr_flock.includes("require separate authorization"));
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
  assert.equal(h.statuses.get("pi_herdr_flock"), "🐑 Flock");
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

test("shutdown invalidates pending initialization before context becomes stale", async () => {
  for (const rejected of [false, true]) {
    let resolve, reject;
    const h = setup(() => new Promise((r, j) => { resolve = r; reject = j; }));
    const pending = h.start();
    h.handlers.session_shutdown?.({ reason: "reload" }, h.ctx);
    Object.defineProperty(h.ctx, "hasUI", {
      get: () => assert.fail("superseded initialization accessed stale context"),
    });
    if (rejected) reject(new Error("late failure"));
    else resolve({ code: 0, killed: false, stdout: "obsolete" });
    await pending;
    assert.equal(h.warnings.length, 0);
    assert.equal(h.statuses.size, 0);
  }
});
