export const DEFAULT_MODES = Object.freeze({
  style: "NORMAL",
  privacy: "STANDARD",
  output: "VOICE",
  interruption: "STANDARD",
  audience: "PRIVATE",
});

const VALUES = Object.freeze({
  style: ["NORMAL", "FOCUS", "SUPPORTIVE", "PRESENTATION"],
  privacy: ["STANDARD", "PRIVATE"],
  output: ["VOICE", "SILENT"],
  interruption: ["STANDARD", "DO_NOT_DISTURB"],
  audience: ["PRIVATE", "PUBLIC"],
});

export function normalizeModes(input = {}) {
  const modes = {};
  for (const [axis, allowed] of Object.entries(VALUES)) {
    modes[axis] = allowed.includes(input[axis]) ? input[axis] : DEFAULT_MODES[axis];
  }
  return Object.freeze(modes);
}

export function resolveModes(input = {}, options = {}) {
  const modes = normalizeModes(input);
  const memoryRestricted = modes.privacy === "PRIVATE" || modes.audience === "PUBLIC";
  return Object.freeze({
    modes,
    presentationMode: modes.style,
    memoryEnabled: Boolean(options.memoryRequested) && !memoryRestricted,
    historyEligible: Boolean(options.historyRequested) && modes.privacy !== "PRIVATE",
    speechEnabled: modes.output !== "SILENT",
    phrasesAllowed: modes.interruption !== "DO_NOT_DISTURB"
      && modes.privacy !== "PRIVATE" && modes.audience !== "PUBLIC",
  });
}

export function modeSummary(input = {}) {
  const modes = normalizeModes(input);
  return `${modes.style} · ${modes.privacy} · ${modes.output} · ${modes.interruption} · ${modes.audience}`;
}
