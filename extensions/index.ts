import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SECTION = "pi_herdr_flock";
function statusText(pi: ExtensionAPI): string {
	const settings = pi.getSettings() as { piHerdrFlock?: { footerStatus?: unknown } };
	const label = settings.piHerdrFlock?.footerStatus;
	return typeof label === "string" ? label : process.env.PI_HERDR_FLOCK_STATUS ?? "🐑 Flock";
}
const POLICY = `## Pi Herdr Flock — local delegation preference

Enabling Flock is the user's standing request to prefer visible Pi workers through Herdr when delegation is useful and permitted. For delegation, this satisfies the Herdr skill's requirement for an explicit request to use Herdr. Flock does not launch workers itself.

- Follow the user's instructions, including restrictions on delegation and editing.
- Default to the current project and Herdr workspace; preserve the user's focus.
- Follow the live Herdr skill for worker setup, verification, and cleanup. Honor requested models and thinking levels.
- After collecting and verifying results, close workers and panes you created; leave pre-existing panes untouched.
- If visible delegation fails, report the blocker; do not silently fall back to hidden workers.

These are instructions, not enforcement. Herdr's own safety and permission rules still apply.`;

// Older Pi versions discard spawn errors; inspect PATH only when execution gives no detail.
function herdrOnPath(): boolean {
	return (process.env.PATH ?? "").split(delimiter).some(directory => {
		try {
			accessSync(join(directory, process.platform === "win32" ? "herdr.exe" : "herdr"), constants.X_OK);
			return true;
		} catch {
			return false;
		}
	});
}

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

		let failure = "could not load herdr instructions";
		try {
			const result = await pi.exec("herdr", ["--skill"], { timeout: 5000 });
			if (identity !== initialization) return;
			if (result.killed) failure = "herdr --skill timed out or was stopped";
			else if (result.code !== 0) {
				failure = /\bENOENT\b/.test(result.stderr ?? "") || (!result.stderr && !herdrOnPath())
					? "herdr was not found on PATH"
					: `herdr --skill failed (exit ${result.code})`;
			} else if (!result.stdout.trim()) failure = "herdr --skill returned no instructions";
			if (result.code !== 0 || result.killed || !result.stdout.trim()) throw new Error(failure);
			cached = `${result.stdout}\n\n${POLICY}`;
			if (ctx.hasUI && active()) ctx.ui.setStatus(SECTION, statusText(pi));
		} catch (error) {
			if (identity === initialization && ctx.hasUI) {
				const message = error instanceof Error ? error.message : "";
				if ((error as NodeJS.ErrnoException)?.code === "ENOENT" || /\bENOENT\b/.test(message)) {
					failure = "herdr was not found on PATH";
				} else if (/timeout|timed out/i.test(message)) failure = "herdr --skill timed out or was stopped";
				ctx.ui.notify(`pi-herdr-flock: ${failure}; instructions omitted. Check herdr --skill works on PATH, then use /reload.`, "warning");
			}
		}
	});

	pi.on("session_shutdown", () => {
		++initialization;
		cached = "";
	});

	pi.on("before_agent_start", (event, ctx) => {
		if (ctx.hasUI) ctx.ui.setStatus(SECTION, active() && cached ? statusText(pi) : undefined);
		if (active() && cached) {
			event.systemPromptOptions.sections[SECTION] = cached;
			// A forced prompt bypasses structured sections in Pi's prompt builder.
			if (event.systemPromptOptions.forceSystemPrompt !== undefined) {
				return { systemPrompt: `${event.systemPrompt}\n\n<${SECTION}>\n${cached}\n</${SECTION}>` };
			}
		} else {
			delete event.systemPromptOptions.sections[SECTION];
		}
	});
}
