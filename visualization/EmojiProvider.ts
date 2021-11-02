import { WideCharacterProvider } from "./WideCharacterProvider";

export class EmojiProvider implements WideCharacterProvider {
    // There is an issue with whether my terminal (Debian 10.2) displays emoji as
    // single or double width. Hence some of these have spaces and others not.
    // It might look buggy on your machine.
    getFor(inputType: string | undefined): string {
        if (inputType == "p1") {
            return "🛑";
        }
        if (inputType == "p2") {
            return "🔵";
        }
        if (inputType == "p3") {
            return "💚";
        }
        if (inputType == "p4") {
            return "🔶";
        }
        if (inputType == "village") {
            return "🏡";
        }
        if (inputType == "city") {
            return "🏛️";
        }
        if (inputType == "hills") {
            return "🧱";
        }
        if (inputType == "forest") {
            return "🌲";
        }
        if (inputType == "mountains") {
            return "⛰️ ";
        }
        if (inputType == "fields") {
            return "🌾";
        }
        if (inputType == "pasture") {
            return "🐑";
        }
        if (inputType == "desert") {
            return "🏜️ ";
        }
        if (inputType == "brick") {
            return "🧱";
        }
        if (inputType == "lumber") {
            return "🌲";
        }
        if (inputType == "ore") {
            return "⛰️ ";
        }
        if (inputType == "grain") {
            return "🌾";
        }
        if (inputType == "wool") {
            return "🐑";
        }
        if (inputType == "robber") {
            return "👺";
        }

        return "  ";
    }
}
