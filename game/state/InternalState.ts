import { HexBoard, HexMatrix, ImmutableHex } from "../board/hex";
import { AuthenticatedPlayer } from "../player/player";
import { GamePhase, ReadableState } from "./interface";

export class InternalState implements ReadableState {
    playersByName: {
        [playerName: string]: AuthenticatedPlayer
    }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.hexBoard.viewBoard();
    }

    getPhase(): GamePhase {
        return this.gamePhase;
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.playersByName[playerIdentifier];
    }

    constructor(
        public hexBoard: HexBoard,
        public playersInTurnOrder: AuthenticatedPlayer[],
        public gamePhase: GamePhase
    ) {
        this.playersByName = {};
        for (const playerInTurnOrder of this.playersInTurnOrder) {
            this.playersByName[playerInTurnOrder.playerName] = playerInTurnOrder;
        }
    }
}
