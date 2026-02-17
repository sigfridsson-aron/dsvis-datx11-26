import { Engine, MessagesObject } from "~/engine";
import { DSArray } from "~/objects/dsarray";
import { TextCircle } from "~/objects/text-circle";
import { Collection } from "~/collections";

export const SortMessages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
        movePointer: (value: string) => `Moving ${value} pointer`
    },
    sort: {
        compare: (a: string, b: string) => `Compare ${a} and ${b}`,
        swap: (a: string, b: string) => `Swap ${a} and ${b}`,
    },
    find: {
        start: (element: string | number) => `Searching for ${element}`,
        found: (element: string | number) => `Found ${element}`,
        notfound: (element: string | number) => `Did not find ${element}`,
        look: (index: number) =>
            `Looking into the next index: ${index}`,
        read: (element: string | number) =>
            `Reading the value of the index: ${element}`,
        nonExistent: (element: string | number) =>
            `Element ${element} does not exist`,
    },
    delete: {
        delete: (value: string) => `Deleting value ${value}`,
        movePointer: (value: string) => `Moving ${value} pointer`
    }
} as const satisfies MessagesObject;

export class DynamicArrayAnim extends Engine implements Collection {
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

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.indexLength = 0;
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new DSArray(1, this.getObjectSize())
        ).init(1, xRoot, yRoot + this.$Svg.margin * 4);
        this.Svg.put(this.sortArray);
        this.sortArray.setDisabled(0, false);
        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
    }

    async insert(...values: Array<number | string>) {
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

    async insertOne(value: number | string) {
        if(this.indexLength >= this.sortArray.getSize()){
            this.sortArray.setSize(this.sortArray.getSize() * 2);
            this.sortArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 4
            );
            const [xRoot, yRoot] = [100, 100];
            let newArray = 
            this.Svg.put(
                new DSArray(this.sortArray.getSize(), this.getObjectSize())
            ).init(this.sortArray.getSize(), xRoot, yRoot + this.$Svg.margin * 6);
            newArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 6
            );
            this.Svg.put(newArray);
        }
        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);
        const currentIndex = this.indexLength;
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex),
            this.sortArray.cy(),
            this.getAnimationSpeed()
        );
        await this.pause(undefined);
        if(this.indexLength == 0){
            
            this.sortArray.addArrow(0, "Head", "#C00");
        }
        else{
            this.sortArray.moveArrow("Head", this.indexLength);
        }


        await this.pause("insert.movePointer", "Head");


        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.indexLength++;
        this.sortArray.setIndexHighlight(currentIndex, false);
    }

    async find(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.findOne(val);
        }
    }

    async findOne(value: string | number): Promise<number | null> {
        await this.pause("find.start", value); //start the search
        let curIndex = 0;
        this.sortArray.setIndexHighlight(curIndex, true);
        await this.pause("find.read", curIndex);
        for(let i = 0; i < this.indexLength; i++){
            if(value == this.sortArray.getValue(i)){
                await this.pause("find.found", value);
                this.sortArray.setIndexHighlight(i, false);
                return i;
            }
            else{
                await this.pause("find.notfound", value); //not found
                this.sortArray.setIndexHighlight(i, false);
                if (i + 1 < this.indexLength) {
                    this.sortArray.setIndexHighlight(i + 1, true);
                    await this.pause("find.look", i + 1);
                }
            }
        }
        await this.pause("find.nonExistent", value);
        return null;
    }
    
     async delete(value: string | number): Promise<void> {
        const index = this.indexLength - 1;
        if(index){
            this.sortArray.setIndexHighlight(index, true);
            await this.pause("delete.delete", value);
            this.sortArray.setIndexHighlight(index, false);
            this.sortArray.setValue(index, "");
            this.indexLength--;
            this.sortArray.moveArrow("Head", this.indexLength - 1);
            await this.pause("delete.movePointer");
        }
        await this.pause(undefined);
    }
    
    async print() {
        throw new Error("Print not implemented");
    }
}
