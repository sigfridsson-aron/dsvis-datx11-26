import { Engine, MessagesObject } from "~/engine";
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

    async swap(arr: DSArray, j: number, k: number) {
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
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

    async sort() {
        throw new Error("Sort not implemented");
    }
}
