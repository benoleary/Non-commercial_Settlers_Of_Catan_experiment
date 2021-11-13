import { WideCharacterProvider } from "./WideCharacterProvider";

/**
 * This class provides emoji characters (usually 2 characters wide but sometimes not) to represent
 * parts of game objects as "art".
 */
export class EmojiProvider implements WideCharacterProvider {
    // There is an issue with whether my terminal (Debian 10.2) displays emoji as
    // single or double width. Hence some of these have spaces and others not.
    // It might look buggy on your machine.
    getFor(inputType: string | undefined): string {
        if (inputType == "red") {
            return "🛑";
        }
        if (inputType == "blue") {
            return "🔵";
        }
        if (inputType == "green") {
            return "💚";
        }
        if (inputType == "yellow") {
            return "🔶";
        }
        if (inputType == "village") {
            return "🏡";
        }
        if (inputType == "city") {
            return "🏛️ ";
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

        // Absent roads are undefined, so should be blank. This has the horrible side effect of
        // potentially hiding bugs by making them invisible.
        return "  ";
    }
}
