import { HexBoard, HexMatrix, ImmutableHex } from "../board/hex";
import { SixSidedDie } from "../die/die";
import { AuthenticatedPlayer, CardBank } from "../player/player";
import { GamePhase, ReadableState, RequestResult } from "./ReadableState";

/**
 * This class represents all the state without rules defining a game: the board of hexes, the
 * pieces on the hexes, and the players hands of resources etc., along with a source of numbers one
 * to six representing the rolls of a die.
 */
export class InternalState implements ReadableState {
    playersByName: {
        [playerName: string]: AuthenticatedPlayer
    }
    cardBank: CardBank;
    lastSuccessfulRequestResult: RequestResult | undefined;

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

        this.cardBank = new CardBank();

        this.lastSuccessfulRequestResult = undefined;
    }
}
