import type { AvatarCueInput, AvatarCueSource, RobotActionName } from "../../types/avatar";

type IntentResult = Omit<AvatarCueInput, "source">;

const cue = (
  action: RobotActionName,
  expression: IntentResult["expression"] = "Neutral",
  holdMs?: number,
): IntentResult => ({ action, expression, ...(holdMs === undefined ? {} : { holdMs }) });

const matches = (text: string, pattern: RegExp) => pattern.test(text);

export function classifyAvatarIntent(text: string, source: AvatarCueSource): AvatarCueInput | null {
  const normalized = text.toLocaleLowerCase();
  let result: IntentResult | null = null;

  if (matches(normalized, /\b(?:hello|hi|hey|good\s+(?:morning|afternoon|evening)|goodbye|bye)\b/u)) {
    result = cue("Wave");
  } else if (matches(normalized, /\b(?:celebrat(?:e|ion|ing)|party|congrat(?:s|ulations)?)\b/u)) {
    result = cue("Dance", "Neutral", 2_400);
  } else if (matches(normalized, /\b(?:wow|amazing|astonishing|surpris(?:e|ed|ing))\b/u)) {
    result = cue("Jump", "Surprised");
  } else if (matches(normalized, /\b(?:angry|frustrat(?:ed|ing|ion)|furious|mad)\b/u)) {
    result = cue("Punch", "Angry");
  } else if (matches(normalized, /\b(?:sorry|sad|upset|unhappy|apolog(?:y|ize|ise)|failed|failure)\b/u)) {
    result = cue("Sitting", "Sad");
  } else if (matches(normalized, /\b(?:yes|agreed|correct|exactly|absolutely)\b/u)) {
    result = cue("Yes");
  } else if (matches(normalized, /\b(?:thank(?:s|\s+you)?|successful|success|great|excellent|approved)\b/u)) {
    result = cue("ThumbsUp");
  } else if (matches(normalized, /\b(?:no|nope|cannot|can't|won't|refus(?:e|ed|al)|unable)\b/u)) {
    result = cue("No", source === "response" ? "Sad" : "Neutral");
  } else if (matches(normalized, /\b(?:run|running|hurry|let's\s+go|lets\s+go)\b/u)) {
    result = cue("Running", "Neutral", 1_800);
  } else if (matches(normalized, /\b(?:walk|walking|step\s+through|guide\s+me)\b/u)) {
    result = cue("Walking", "Neutral", 1_800);
  }

  return result ? { source, ...result } : null;
}
