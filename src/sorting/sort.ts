import { Engine, MessagesObject } from "~/engine";
import { DSArray } from "~/objects/dsarray";
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

export class Sort extends Engine implements Sorter {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: DSArray;
    indexLength: number = 0;
    baseSize: number = 28;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new DSArray(0, this.getObjectSize()); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    // Ändrade här så att det börjar med en ingen array
    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.indexLength = 0;
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new DSArray(0, this.getObjectSize()) // det stod new DSArray(1, this.getObjectSize())
        ).init(0, xRoot, yRoot + this.$Svg.margin * 4); // det stod this.sortArray = new DSArray(1, this.getObjectSize());
        this.Svg.put(this.sortArray);
        //this.sortArray.setDisabled(1, false);
        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
    }

    async insert(...values: Array<number | string>) {
        this.sortArray.setSize(this.sortArray.getSize() + values.length);
        this.sortArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async swap(arr: DSArray, j: number, k: number) {
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
    }

    async swapNoAnm(arr: DSArray, j: number, k: number) {
        arr.swap(j, k, false);
        arr.setIndexHighlight(j, false);
        this.sortArray.getValue(j),
        this.sortArray.getValue(k)
    }


    // Kommenterade ut animeringeringen till arrayen.
    async insertOne(value: number | string) {
        value = String(value);
        /* detta är animationen vid inläggningen*/
        // const arrayLabel = this.Svg.put(
        //     new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        // ).init(...this.getNodeStart());

        /* denna awaiten behövs inte om inte peter vill ha en paus */
        //await this.pause("insert.value", value);
        const currentIndex = this.indexLength;
        /* detta är animationen vid inläggningen*/
        // arrayLabel.setCenter(
        //     this.sortArray.getCX(currentIndex),
        //     this.sortArray.cy(),
        //     this.getAnimationSpeed()
        // );

        /* denna awaiten behövs inte om inte peter vill ha en paus */
        //await this.pause(undefined);

        // arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.indexLength++;
        this.sortArray.setIndexHighlight(currentIndex, false);
    }

    async sort() {
        throw new Error("Sort not implemented");
    }

    async unsort(args?: string | number) {
        const unsortSelect = document.querySelector<HTMLSelectElement>("select.unsort");
        const unsortType = unsortSelect?.value;
        const sortingMethodSelect = document.querySelector<HTMLSelectElement>("select.sortingMethod");
        if (unsortType === "unsortRandom") {
            for (let i = this.indexLength - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                await this.swapNoAnm(this.sortArray, i, j);
            }
        } else if (unsortType === "unsortReversed") {
            for (let i = 0; i < Math.floor(this.indexLength / 2); i++) {
                await this.swapNoAnm(this.sortArray, i, this.indexLength - 1 - i);
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
