export type AssistantState = "idle" | "thinking" | "streaming" | "done";

export type AssistantCharacter = "alex" | "ava";

export type AssistantPersonality = "professional" | "friendly" | "concise";

export type AssistantConfig = {
  character: AssistantCharacter;
  name: string;
  personality: AssistantPersonality;
  voiceEnabled: boolean;
};
