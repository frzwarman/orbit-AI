export const AVATAR_BASE_STATES = ["Walking", "Running", "Dance", "Death", "Sitting", "Standing"] as const;
export const AVATAR_EMOTES = ["Jump", "Yes", "No", "Wave", "Punch", "ThumbsUp"] as const;
export const AVATAR_EXPRESSIONS = ["Neutral", "Angry", "Surprised", "Sad"] as const;

export type AvatarBaseState = (typeof AVATAR_BASE_STATES)[number];
export type AvatarEmote = (typeof AVATAR_EMOTES)[number];
export type AvatarExpression = (typeof AVATAR_EXPRESSIONS)[number];
export type RobotActionName = "Idle" | AvatarBaseState | AvatarEmote;

export type AvatarEmoteRequest = {
  name: AvatarEmote;
  sequence: number;
};
