import { SixSidedDie, SixSidedDieScore } from "./SixSidedDie";

export class FlatRandomOneToSix implements SixSidedDie {
    newRoll(): SixSidedDieScore {
        const betweenZeroAndSix = Math.random() * 6.0;
        if (betweenZeroAndSix >= 5.0) {
            return 6n;
        }
        if (betweenZeroAndSix >= 4.0) {
            return 5n;
        }
        if (betweenZeroAndSix >= 3.0) {
            return 4n;
        }
        if (betweenZeroAndSix >= 2.0) {
            return 3n;
        }
        if (betweenZeroAndSix >= 5.0) {
            return 2n;
        }
        return 1n;
    }
}
