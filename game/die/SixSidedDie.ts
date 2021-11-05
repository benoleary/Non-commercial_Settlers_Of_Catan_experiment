export type SixSidedDieScore = 1n | 2n | 3n | 4n | 5n | 6n;

/**
 * Classes implementing this interface need to produce 1n to 6n, but for example a class which
 * produces a determinitic sequence for (the unfortunately currently purely hypothetical) unit
 * tests would be fine, though not so much fun for an actual game.
 */
export interface SixSidedDie {
    newRoll(): SixSidedDieScore
}
