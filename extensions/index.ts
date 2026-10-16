import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SECTION = "pi_herdr_flock";
const statusText = () => process.env.PI_HERDR_FLOCK_STATUS ?? "🐑 Flock";
const POLICY = `## Pi Herdr Flock — local delegation preference

Enabling Flock is the user's standing request to prefer visible Pi workers through Herdr when delegation is useful and permitted. For delegation, this satisfies the Herdr skill's requirement for an explicit request to use Herdr. Flock does not launch workers itself.

- Follow the user's instructions, including restrictions on delegation and editing.
- Default to the current project and Herdr workspace; preserve the user's focus.
- Follow the live Herdr skill for worker setup, verification, and cleanup. Honor requested models and thinking levels.
- If visible delegation fails, report the blocker; do not silently fall back to hidden workers.

These are instructions, not enforcement. Herdr's own safety and permission rules still apply.`;

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
			if (ctx.hasUI && active()) ctx.ui.setStatus(SECTION, statusText());
		} catch {
			if (identity === initialization && ctx.hasUI) {
				ctx.ui.notify("pi-herdr-flock: could not load herdr --skill; instructions omitted.", "warning");
			}
		}
	});

	pi.on("session_shutdown", () => {
		++initialization;
		cached = "";
	});

	pi.on("before_agent_start", (event, ctx) => {
		if (ctx.hasUI) ctx.ui.setStatus(SECTION, active() && cached ? statusText() : undefined);
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
