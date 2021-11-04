import { VisualizationUsingWideCharacters } from "./VisualizationUsingWideCharacters";
import { AuthenticatedPlayer } from "../game/player/player";

export class PlayerVisualization extends VisualizationUsingWideCharacters {
    constructor(useEmoji: boolean) {
        super(useEmoji);
    }

    asString(displayedPlayer: AuthenticatedPlayer): string {
        const playerHand =
            displayedPlayer
            .getResourceArray()
            .map(resourceCard => this.wideCharacterProvider.getFor(resourceCard))
            .join(" ");
        const playerName = displayedPlayer.playerName
        return (
            `${playerName} (road: ${this.wideCharacterProvider.getFor(playerName)}): ${playerHand}`
        );
    }
}
