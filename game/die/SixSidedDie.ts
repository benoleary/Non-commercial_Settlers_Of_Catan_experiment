export type SixSidedDieScore = 1n | 2n | 3n | 4n | 5n | 6n;

export interface SixSidedDie {
    newRoll(): SixSidedDieScore
}
