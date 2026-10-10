import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SECTION = "pi_herdr_flock";
const POLICY = `## Pi Herdr Flock — local delegation preference

This enabled extension expresses the user's standing request to use Herdr for otherwise-permitted Pi delegation. For worker execution only, that satisfies the CLI skill's explicit-Herdr-request requirement and permits project-local sibling panes or tabs. It does not authorize delegation forbidden by the task or unrelated Herdr operations.

- Delegate only when useful and permitted. Define the required expert on demand; existing role definitions are optional references.
- Use visible Pi workers through Herdr, not hidden Agent/SubagentWorkflow mechanisms. This is guidance, not tool enforcement.
- Prefer sibling splits; use tabs when layout requires. Stay in the caller's workspace and working directory; preserve focus. Different projects, new workspaces, and worktrees require separate authorization.
- Give each worker a bounded task, expertise, context, read/edit scope, verification, completion criteria, and model/thinking choice. Honor user preferences; hardcode no providers, roles, or escalation tiers.
- Use returned surface IDs. Observe state and read results; submission is not completion. Inspect timeouts before retrying to avoid duplicate tasks. Access failures need an available model, not identical retries.
- Parent verifies actual results/diffs and relevant checks. Avoid concurrent conflicting writes. Prompt restrictions are not a sandbox.
- Close only task-created surfaces after collecting results unless retention was requested. No silent fallback to hidden workers when Herdr fails.

This appendix is an explicit local policy exception for worker transport and project-local topology—not a claim that upstream Herdr grants blanket permission. Other operations retain the live skill's consent and safety requirements. Later explicit user instructions take precedence over this default preference.`;

function active(): boolean {
	return process.env.HERDR_ENV === "1" &&
		Boolean(process.env.HERDR_PANE_ID?.trim()) &&
		Boolean(process.env.HERDR_SOCKET_PATH?.trim());
}

export default function (pi: ExtensionAPI) {
	let cached = "";
	let initialization = 0;

	pi.on("session_start", async (_event, ctx) => {
		const identity = ++initialization;
		cached = "";
		if (ctx.hasUI) ctx.ui.setStatus(SECTION, undefined);
		if (!active()) return;

		try {
			const result = await pi.exec("herdr", ["--skill"], { timeout: 5000 });
			if (identity !== initialization) return;
			if (result.code !== 0 || result.killed || !result.stdout.trim()) {
				throw new Error("herdr --skill did not return usable instructions");
			}
			cached = `${result.stdout}\n\n${POLICY}`;
			if (ctx.hasUI && active()) ctx.ui.setStatus(SECTION, "flock active");
		} catch {
			if (identity === initialization && ctx.hasUI) {
				ctx.ui.notify("pi-herdr-flock: could not load herdr --skill; instructions omitted.", "warning");
			}
		}
	});

	pi.on("before_agent_start", (event, ctx) => {
		if (ctx.hasUI) ctx.ui.setStatus(SECTION, active() && cached ? "flock active" : undefined);
		if (active() && cached) {
			event.systemPromptOptions.sections[SECTION] = cached;
		} else {
			delete event.systemPromptOptions.sections[SECTION];
		}
	});
}
