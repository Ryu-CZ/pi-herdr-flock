import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getCurrentSystemMessage } from "@earendil-works/pi-ai";
import extension from "../extensions/index.ts";

// Pin these internal test seams to the declared Pi development dependency.
const core = new URL("../node_modules/@earendil-works/pi-coding-agent/dist/core/", import.meta.url);
const { createEventBus } = await import(new URL("event-bus.js", core));
const { createExtensionRuntime, loadExtensionFromFactory } = await import(new URL("extensions/loader.js", core));
const { ExtensionRunner, emitSessionShutdownEvent } = await import(new URL("extensions/runner.js", core));
const { SessionManager } = await import(new URL("session-manager.js", core));
const { buildSystemPromptSections, diffSystemPromptSections } = await import(new URL("system-prompt.js", core));

const keys = ["HERDR_ENV", "HERDR_PANE_ID", "HERDR_SOCKET_PATH", "PI_HERDR_FLOCK_STATUS"];
const original = keys.map(key => process.env[key]);
afterEach(() => keys.forEach((key, i) => {
  if (original[i] === undefined) delete process.env[key];
  else process.env[key] = original[i];
}));

async function harness(exec, companion = false) {
  Object.assign(process.env, { HERDR_ENV: "1", HERDR_PANE_ID: "caller", HERDR_SOCKET_PATH: "/socket" });
  delete process.env.PI_HERDR_FLOCK_STATUS;
  const runtime = createExtensionRuntime();
  const bus = createEventBus();
  const loaded = await loadExtensionFromFactory(pi => extension({
    on: pi.on.bind(pi),
    exec,
  }), process.cwd(), bus, runtime, "flock");
  const extensions = [loaded];
  if (companion) extensions.push(await loadExtensionFromFactory(pi => {
    pi.on("before_agent_start", event => {
      event.systemPromptOptions.sections.companion = "another extension";
    });
  }, process.cwd(), bus, runtime, "companion"));
  const manager = SessionManager.inMemory(process.cwd());
  const runner = new ExtensionRunner(extensions, runtime, process.cwd(), manager, {});
  const errors = [];
  const warnings = [];
  const statuses = new Map();
  runner.onError(error => errors.push(error));
  runner.setUIContext({
    setStatus(key, text) {
      if (text === undefined) statuses.delete(key);
      else statuses.set(key, text);
    },
    notify: (...args) => warnings.push(args),
  }, "tui");
  const start = reason => runner.emit({ type: "session_start", reason });
  const turn = () => runner.emitBeforeAgentStart("ordinary request", undefined, {
    cwd: process.cwd(), sections: { unrelated: "keep" },
  });
  return { runner, manager, errors, warnings, statuses, start, turn };
}

const success = stdout => ({ code: 0, killed: false, stdout });

async function shutdown(h, reason) {
  await emitSessionShutdownEvent(h.runner, { type: "session_shutdown", reason });
  h.runner.invalidate();
}

test("real Pi prompt dispatch coexists with another extension and survives compaction", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; return success(" complete skill\n"); }, true);
  await h.start("startup");
  const first = await h.turn();
  const sections = buildSystemPromptSections(first.systemPromptOptions);
  assert.equal(sections.companion, "<companion>\nanother extension\n</companion>");
  assert.equal(sections.unrelated, "<unrelated>\nkeep\n</unrelated>");
  assert.ok(sections.pi_herdr_flock.includes(" complete skill\n"));
  assert.deepEqual(first.messages, [], "no custom conversation-message injection");
  assert.equal(first.systemPromptOptions.forceSystemPrompt, undefined);

  h.manager.appendMessage({ role: "system", content: "", sections, timestamp: 1 });
  const userId = h.manager.appendMessage({ role: "user", content: "request", timestamp: 2 });
  h.manager.appendCompaction("summary", userId, 100);
  const checkpoint = getCurrentSystemMessage(h.manager.buildSessionContext().messages);
  assert.equal(checkpoint.sections.pi_herdr_flock, sections.pi_herdr_flock);
  const next = await h.turn();
  assert.equal(diffSystemPromptSections(checkpoint.sections, buildSystemPromptSections(next.systemPromptOptions)), undefined);
  assert.equal(calls, 1);

  delete process.env.HERDR_ENV;
  const inactive = await h.turn();
  const patch = diffSystemPromptSections(checkpoint.sections, buildSystemPromptSections(inactive.systemPromptOptions));
  assert.deepEqual(patch, { pi_herdr_flock: null });
  assert.equal(h.statuses.size, 0);
  assert.deepEqual(h.errors, []);
});

test("real guarded Pi contexts ignore both late outcomes after reload teardown", async () => {
  for (const rejected of [false, true]) {
    let resolve, reject;
    const old = await harness(() => new Promise((r, j) => { resolve = r; reject = j; }));
    const pending = old.start("startup");
    await shutdown(old, "reload");
    const latest = await harness(async () => success("latest"));
    await latest.start("reload");
    if (rejected) reject(new Error("late failure"));
    else resolve(success("obsolete"));
    await pending;
    assert.deepEqual(old.errors, []);
    assert.deepEqual(old.warnings, []);
    const next = await latest.turn();
    assert.ok(next.systemPromptOptions.sections.pi_herdr_flock.startsWith("latest\n\n"));
    assert.equal(latest.statuses.get("pi_herdr_flock"), "🐑 flock");
    assert.deepEqual(latest.errors, []);
  }
});

test("Pi session-transition start reasons refresh cached instructions and clear failed fetches", async () => {
  let calls = 0;
  const h = await harness(async () => {
    calls++;
    return calls === 3 ? { code: 1, killed: false, stdout: "" } : success(`skill ${calls}`);
  });
  for (const [index, reason] of ["startup", "new", "switch", "fork"].entries()) {
    await h.start(reason);
    const turn = await h.turn();
    if (index === 2) {
      assert.equal(turn.systemPromptOptions.sections.pi_herdr_flock, undefined);
      assert.equal(h.statuses.size, 0);
    } else assert.ok(turn.systemPromptOptions.sections.pi_herdr_flock.startsWith(`skill ${index + 1}\n\n`));
  }
  assert.equal(calls, 4);
  assert.equal(h.warnings.length, 1);
  assert.deepEqual(h.errors, []);
});
