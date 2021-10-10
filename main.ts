import { HexBoard } from "./game/board/hex"
import { Game } from "./game/state"

console.log("Example game played with occasional logging of relevant state");

let exampleGame = new Game(HexBoard.getFullyRandomBoard());

console.log(exampleGame)
