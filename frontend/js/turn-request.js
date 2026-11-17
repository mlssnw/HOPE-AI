import { resolveModes } from "./modes.js";

export function buildChatPayload({
  message,
  history,
  useWeb,
  useVault,
  memoryRequested,
  modes,
}) {
  const policy = resolveModes(modes, { memoryRequested });
  return {
    message,
    history,
    use_web: Boolean(useWeb),
    use_vault: Boolean(useVault),
    memory_enabled: policy.memoryEnabled,
    presentation_mode: policy.presentationMode,
  };
}
