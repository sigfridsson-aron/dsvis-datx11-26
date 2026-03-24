import { Engine, SubmitFunction } from "~/engine";
import { querySelector } from "~/helpers";
import { Collection } from "~/collections";
import { CollectionAlgorithmControl } from "./collection-algorithm-controls";

export class HashTableAlgorithmControl extends CollectionAlgorithmControl {
    HashFunctionSelector: HTMLSelectElement;

    constructor(container: HTMLElement, engine: Collection) {
        super(container, engine);

        this.engine = engine;

        this.algorithmControls.insertAdjacentHTML(
            "beforeend",
            `<span class="formgroup"><label>
                Hash Function:
                <select id="hashFunction" class="HashFunctionSelector disableWhenRunning">
                <option value="0">Rolling Hash</option>
                <option value="1">First Character</option>
                <option value="2">Sum of Characters</option>
                </select>
            </label></span>`
        );

        this.HashFunctionSelector = querySelector<HTMLSelectElement>(
            "select.HashFunctionSelector",
            container
        );

        this.HashFunctionSelector.addEventListener("change", () =>
            this.engine.submit(this.engine.resizeHashtable, null)
        );
    }
}
