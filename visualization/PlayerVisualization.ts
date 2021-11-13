import { AuthenticatedPlayer } from "../game/player/player";
import { WideCharacterProvider } from "./WideCharacterProvider";

/**
 * This class represents the players' assets as strings which can be printed to the console.
 */
export class PlayerVisualization {
    constructor(private wideCharacterProvider: WideCharacterProvider) { }

    asString(displayedPlayer: AuthenticatedPlayer): string {
        const playerHand =
            displayedPlayer
            .getResourceArray()
            .map(resourceCard => this.wideCharacterProvider.getFor(resourceCard))
            .join(" ");
        return (
            `${displayedPlayer.playerName}`
            + ` (road: ${this.wideCharacterProvider.getFor(displayedPlayer.playerColor)})`
            + ` - victory points: ${displayedPlayer.getVictoryPointScore()}`
            + ` - hand: ${playerHand}`
        );
    }
}
