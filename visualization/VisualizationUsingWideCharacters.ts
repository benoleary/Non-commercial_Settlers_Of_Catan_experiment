import { WideCharacterProvider } from "./WideCharacterProvider";
import { EmojiProvider } from "./EmojiProvider";
import { AsciiProvider } from "./AsciiProvider";

export class VisualizationUsingWideCharacters {
    constructor(useEmoji: boolean) {
        this.wideCharacterProvider = useEmoji ? new EmojiProvider() : new AsciiProvider();
    }

    protected wideCharacterProvider: WideCharacterProvider
}
