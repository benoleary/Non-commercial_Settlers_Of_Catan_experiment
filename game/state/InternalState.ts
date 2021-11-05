import { HexBoard, HexMatrix, ImmutableHex } from "../board/hex";
import { SixSidedDie } from "../die/die";
import { AuthenticatedPlayer } from "../player/player";
import { GamePhase, ReadableState, RequestResult } from "./interface";

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

    getLastSuccessfulRequestResult(): RequestResult | undefined {
        return this.lastSuccessfulRequestResult;
    }

    public lastSuccessfulRequestResult: RequestResult | undefined;

    constructor(
        public hexBoard: HexBoard,
        public sixSidedDie: SixSidedDie,
        public playersInTurnOrder: AuthenticatedPlayer[],
        public gamePhase: GamePhase
    ) {
        this.playersByName = {};
        for (const playerInTurnOrder of this.playersInTurnOrder) {
            this.playersByName[playerInTurnOrder.playerName] = playerInTurnOrder;
        }

        this.lastSuccessfulRequestResult = undefined;
    }
}
