import { Engine, MessagesObject, SubmitFunction } from "~/engine";
import { DSArray } from "~/objects/dsarray";
import { StapleArray } from "~/objects/staple-array";
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

export class BaseSorter extends Engine implements Sorter {

    STAPLE_MAX_HEIGHT: number = 100;
    STAPLE_WIDTH: number = 25; // TODO: replace these with dynamic sizes depending on the chosen "nodeSize"

    initialValues: number[] = [];
    // compensate: number = 0; // TODO: remove?
    sortArray: StapleArray;
    // indexLength: number = 0; // TODO: remove
    // baseSize: number = 28;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new StapleArray([], this.STAPLE_MAX_HEIGHT, this.STAPLE_WIDTH); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues: number[] = [32, 83, 22, 15, 8, 12, 43, 54, 23 ,34, 76 ,87, 32]) {
        this.initialValues = initialValues;
        super.initialise();
    }

    // Ändrade här så att det börjar med en ingen array
    async resetAlgorithm() {
        await super.resetAlgorithm();
        // this.indexLength = 0; // TODO: Remove
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new StapleArray(this.initialValues, this.STAPLE_MAX_HEIGHT, this.STAPLE_WIDTH) // det stod new DSArray(1, this.getObjectSize())
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
        this.sortArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async swap(arr: StapleArray, j: number, k: number) {
        arr.swap(j, k);
        arr.setStapleHighlight(j);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
    }

    async swapNoAnm(arr: StapleArray, j: number, k: number) {
        arr.swap(j, k);
        arr.clearStapleHighlight(j);
        this.sortArray.getValue(j),
        this.sortArray.getValue(k)
    }

    // Kommenterade ut animeringeringen till arrayen.
    async insertOne(value: number | string) {
        if (typeof value === 'number') {
            this.sortArray.addValues(value)
        }

        /* detta är animationen vid inläggningen*/
        // const arrayLabel = this.Svg.put(
        //     new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        // ).init(...this.getNodeStart());

        /* denna awaiten behövs inte om inte peter vill ha en paus */
        //await this.pause("insert.value", value);
        // const currentIndex = this.indexLength; // TODO remove this?
        /* detta är animationen vid inläggningen*/
        // arrayLabel.setCenter(
        //     this.sortArray.getCX(currentIndex),
        //     this.sortArray.cy(),
        //     this.getAnimationSpeed()
        // );

        /* denna awaiten behövs inte om inte peter vill ha en paus */
        //await this.pause(undefined);

        // arrayLabel.remove();

        // TODO: remove this?
        // this.sortArray.setDisabled(currentIndex, false);
        // this.sortArray.setValue(currentIndex, value);
        // this.sortArray.setIndexHighlight(currentIndex, true);
        // this.indexLength++;
        // this.sortArray.setIndexHighlight(currentIndex, false);
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

    async setArraySize(...args: (string | number)[]): Promise<void> {
        this.sortArray.delete();
        if (isNaN(Number(args[0])) || isNaN(parseInt(String(args[0])))) {
            console.debug("setArraySize needs a number as argument");
            throw new Error("Incorrect argument to setArraySize");
        }
        const size: number = Number(args[0]);
        const values: number[] = Array.apply(null, Array(size)).map((_) => {
            return Math.floor(Math.random() * 99) + 1;
        });
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new StapleArray(values, this.STAPLE_MAX_HEIGHT, this.STAPLE_WIDTH)
        ).init(
            xRoot,
            yRoot + this.$Svg.margin * 4
        );
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
        } else if (unsortType === "unsortGood") {
            // I aint happy with all the if statements, should be changed
            if (sortingMethodSelect?.value === "selectionSort") {
                // an already sorted array is the best case for selection sort, so we can just do nothing
            } else if (sortingMethodSelect?.value === "insertionSort") {
                // ?
            } else if (sortingMethodSelect?.value === "mergeSort") {
                // ?
            } else if (sortingMethodSelect?.value === "quickSort") {
                // ?
            }
        }
    }
}
