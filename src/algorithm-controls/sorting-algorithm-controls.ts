import { addReturnSubmit, querySelector } from "~/helpers";
import { Sorter } from "~/sorting";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class SortingAlgorithmControls extends EngineAlgorithmControl {
    presetSizeSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    sortSubmit: HTMLInputElement;
    pseudoCode: HTMLDivElement;
    clearSubmit: HTMLInputElement;
    unsortSelect: HTMLSelectElement;
    engine: Sorter;

    constructor(container: HTMLElement, engine: Sorter) {
        super(container);
        this.engine = engine;

        this.presetSizeSelect = querySelector<HTMLSelectElement>(
            "select#presetSizeSelect",
            container
        );
        this.insertField = querySelector<HTMLInputElement>(
            "input#insertField",
            container
        );
        this.insertSubmit = querySelector<HTMLInputElement>(
            "input#insertSubmit",
            container
        );
        this.clearSubmit = querySelector<HTMLInputElement>(
            "input#clearSubmit",
            container
        );
        this.pseudoCode = querySelector<HTMLDivElement>(
            "div.pseudoCode",
            container
        );
        this.sortSubmit = querySelector<HTMLInputElement>(
            "input#sortSubmit",
            container
        );
        this.unsortSelect = querySelector<HTMLSelectElement>(
            "select#unsortSelect",
            container
        );

        this.initialize();
    }

    initialize() {
        this.presetSizeSelect.addEventListener("change", () => {
            let arraySize: number;
            let objectSize: string | undefined;
            switch (this.presetSizeSelect.value) {
                case "tiny":
                    arraySize = 10;
                    objectSize = "huge"
                    break;
                case "small":
                    arraySize = 20;
                    objectSize = "large"
                    break;
                case "medium":
                    arraySize = 50
                    objectSize = "medium"
                    break;
                case "large":
                    arraySize = 100;
                    objectSize = "small"
                    break;
                case "huge":
                    arraySize = 200;
                    objectSize = "tiny"
                    break;
                case "empty":
                    arraySize = 0;
                    break;
                default:
                    console.debug("Value of preset size selected was incorrect");
                    return;
            }

            this.engine.setArraySize(arraySize);
            if (objectSize) {
                this.engine.generalControls.objectSizeSelect.value = objectSize;
                this.engine.generalControls.objectSizeSelect.dispatchEvent(
                    new Event("change")
                );
            }
        });

        addReturnSubmit(this.insertField, "ALPHANUM+", () =>
            this.engine.submit(this.engine.insert, this.insertField)
        );

        this.insertSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.insert, this.insertField)
        );

        this.sortSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.sort, null)
        );

        this.clearSubmit.addEventListener("click", () =>
            this.engine.confirmResetAll()
        );

        this.unsortSelect.addEventListener("change", () => {
            this.engine.submit(this.engine.unsort, null);
        });

    }
}
