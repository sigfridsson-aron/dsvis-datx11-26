import { addReturnSubmit, querySelector } from "~/helpers";
import { Sorter } from "~/sorting";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class SortingAlgorithmControls extends EngineAlgorithmControl {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    customInsertContainer: HTMLSpanElement;
    sortSubmit: HTMLInputElement;
    pseudoCode: HTMLDivElement;
    clearSubmit: HTMLInputElement;
    unsortSelect: HTMLSelectElement;
    engine: Sorter;

    constructor(container: HTMLElement, engine: Sorter) {
        super(container);
        this.engine = engine;

        this.insertSelect = querySelector<HTMLSelectElement>(
            "select.insertSelect",
            container
        );
        this.insertField = querySelector<HTMLInputElement>(
            "input.insertField",
            container
        );
        this.insertSubmit = querySelector<HTMLInputElement>(
            "input.insertSubmit",
            container
        );
        this.customInsertContainer = querySelector<HTMLSpanElement>(
            "span#customInsertContainer"
        )
        this.clearSubmit = querySelector<HTMLInputElement>(
            "input.clearSubmit",
            container
        );
        this.pseudoCode = querySelector<HTMLDivElement>(
            "div.pseudoCode",
            container
        );
        this.sortSubmit = querySelector<HTMLInputElement>(
            "input.sortSubmit",
            container
        );
        this.unsortSelect = querySelector<HTMLSelectElement>(
            "select.unsort",
            container
        );

        this.initialize();
    }

    initialize() {
        this.insertSelect.addEventListener("change", () => {
            if (this.insertSelect.value === "custom") {
                this.customInsertContainer.classList.remove("hidden")
            } else {
                this.customInsertContainer.classList.add("hidden")
                this.engine.submit(this.engine.setArraySize, this.insertSelect) // TODO: Fix this
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
