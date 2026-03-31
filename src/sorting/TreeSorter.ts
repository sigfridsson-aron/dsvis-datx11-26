import { Engine, MessagesObject, SubmitFunction } from "~/engine";
import { DSArray } from "~/objects/dsarray";
import { TreeArray } from "~/objects/tree-array";
import { TextCircle } from "~/objects/text-circle";
import { Sorter } from "~/sorting";

export const SortMessages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a: string, b: string) => `Compare ${a} and ${b}`,
        swap: (a: string, b: string) => `Swap ${a} and ${b}`,
    },
} as const satisfies MessagesObject;

export class TreeSorter extends Engine implements Sorter {

    TREE_MAX_HEIGHT: number = 100;
    TREE_WIDTH: number = 25; // TODO: replace these with dynamic sizes depending on the chosen "nodeSize"

    initialValues: number[] = [];
    // compensate: number = 0; // TODO: remove?
    sortArray: TreeArray;
    // indexLength: number = 0; // TODO: remove
    // baseSize: number = 28;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new TreeArray([], this.TREE_MAX_HEIGHT, this.getObjectSize()); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues: number[] = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    // Ändrade här så att det börjar med en ingen array
    async resetAlgorithm() {
        await super.resetAlgorithm();
        // this.indexLength = 0; // TODO: Remove
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new TreeArray(this.initialValues, this.TREE_MAX_HEIGHT, this.getObjectSize()) // det stod new DSArray(1, this.getObjectSize())
        ).init(xRoot, yRoot + this.$Svg.margin * 4); // det stod this.sortArray = new DSArray(1, this.getObjectSize());

        //this.sortArray.setDisabled(1, false);

        // TODO: remove (replaced by adding initial values when creating the array)
        // if (this.initialValues) {
        //     this.state.runWhileResetting(
        //         async () => await this.insert(...this.initialValues)
        //     );
        // }
    }

    async insert(...values: Array<number | string>) {
        this.sortArray.addValues(...values.filter((value: number | string) => typeof value === "number"))
    }

    async swap(arr: TreeArray, j: number, k: number) {
        arr.swap(j, k);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
    }

    async swapNoAnm(arr: TreeArray, j: number, k: number) {
        arr.swap(j, k, false);
        arr.clearTreeHighlight(j);
        this.sortArray.getValue(j),
        this.sortArray.getValue(k)
    }

    // Kommenterade ut animeringeringen till arrayen.
    async insertOne(value: number | string) { // TODO: remove?
        if (typeof value === 'number') {
            this.sortArray.addValues(value)
        }
    }

    async submit(
        method: SubmitFunction,
        field: HTMLInputElement | null
    ): Promise<boolean> {
        if (field === null) {
            await this.execute(method, [])
            return true
        }
        let rawValue: string = "";
        try {
                rawValue = field.value;
                field.value = "";
                const inputNumbers = rawValue
                    .split(" ")
                    .filter(
                        (value) =>
                            !isNaN(Number(value)) && !isNaN(parseInt(value))
                    )
                    .map((value) => parseInt(value));
                await this.execute(method, inputNumbers);
                return true;
        } catch (e: any) {
            console.error(e);
            return false;
        }
    }

    setArraySize(size: number): void {
        const values: number[] = Array.apply(null, Array(size)).map((_) => {
            return Math.floor(Math.random() * 99) + 1;
        });
        this.initialise(values)
    }

    async sort() {
        throw new Error("Sort not implemented");
    }

    async unsort(args?: string | number) {
        const unsortSelect = document.querySelector<HTMLSelectElement>("select.unsort");
        const unsortType = unsortSelect?.value;
        const sortingMethodSelect = document.querySelector<HTMLSelectElement>("select.sortingMethod");
        if (unsortType === "unsortRandom") {
            for (let i = this.sortArray.length() - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                await this.swapNoAnm(this.sortArray, i, j);
            }
        } else if (unsortType === "unsortReversed") {
            for (let i = 0; i < Math.floor(this.sortArray.length() / 2); i++) {
                await this.swapNoAnm(this.sortArray, i, this.sortArray.length() - 1 - i);
            }
        }
    }

    getObjectSize(): number {
        // TODO: show max and min values when text is hidden
        switch (this.generalControls.objectSizeSelect.value) {
            case "tiny":
                return 3
            case "small":
                return 8
            case "medium":
                return 15
            case "large":
                return 30
            case "huge":
                return 40
            default:
                console.debug("There was an error getting the object size")
                return 15
        }
    }
}
