export type ResourceType = "brick" | "lumber" | "ore" | "grain" | "wool";

// These are the scores on a roll of 2d6 which generate resources, so integers
// 2 to 12, skipping over 7 (the robber case).
export type ProductionRollScore = 2n | 3n | 4n | 5n | 6n | 8n | 9n | 10n | 11n | 12n;
