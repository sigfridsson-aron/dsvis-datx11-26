import { Engine, MessagesObject } from "~/engine";
import { DynamicArray } from "~/basic/dynamicArray";
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
    copy: {
        index: (index: number) => `Copying index: ${index}`,
        newSize: (size: number) => `Creating new Dynamic Array of length:  ${size}`,
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
        delete: (value: string) => `Deleting value at head`,
        removePointer: (value: string) => `Removing ${value} pointer`,
        movePointer: (value: string) => `Moving ${value} pointer`
    },
} as const satisfies MessagesObject;

export class QueueDynamicArrayAnim extends Engine implements Collection {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: DynamicArray;
    indexLength: number = 0;
    baseSize: number = 28;
    head: number = 0;
    tail: number = 0;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new DynamicArray(0, this.getObjectSize()); // Only added to make sure that sortArray never is null
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
            new DynamicArray(1, this.getObjectSize())
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

    async swap(arr: DynamicArray, j: number, k: number) {
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
    }

    async resize(length: number){
        const [xRoot, yRoot] = this.getTreeRoot();
        let newArray = 
        this.Svg.put(
            new DynamicArray(this.sortArray.getSize(), this.getObjectSize())
        ).init(0, xRoot, yRoot + this.$Svg.margin * 6);
        newArray.setSize(length);
        newArray.center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 4 + this.getObjectSize() * 4
        );
            
        await this.pause("copy.newSize", length);


        await this.pause("Copy values to the new array");

        let i = this.tail;
        for(let ii = 0; ii < this.indexLength; ii++){
            console.log(i);
            let val = this.sortArray.getValue(i)
            const arrayLabel = this.Svg.put(
                new TextCircle(val, this.getObjectSize(), this.getStrokeWidth())
            ).init(this.sortArray.getCX(i), this.sortArray.getCY(i));

            await this.pause("copy.index", i);

            arrayLabel.setCenter(
            newArray.getCX(ii),
            newArray.getCY(ii),
            this.getAnimationSpeed()
            );

            await this.pause(undefined);

            arrayLabel.remove();
                
            newArray.setValue(ii, val);
            i = (i + 1) % this.sortArray.getSize();
        }

        if(length != 1){ //only resizes if it has an arrow
            newArray.addArrow(this.indexLength - 1, "Head",  "#C00");
            this.head = this.indexLength - 1;
            await this.pause("Copy Head pointer");

            newArray.addArrow(0, "Tail",  "#4C0");
            this.tail = 0;
            await this.pause("Copy Tail pointer");
        }

        this.sortArray.remove();
        this.sortArray = newArray;
        this.animate(this.sortArray, !this.state.isResetting()).center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin + Number(this.sortArray.height()) / 2
        );

        await this.pause(undefined);
    }

    async insertOne(value: number | string) {
        console.log("indexLength = " + this.indexLength);
        if(this.indexLength >= this.sortArray.getSize()){
            await this.pause("Dynamic Array is full!");
            await this.resize(this.indexLength * 2);
        }
        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);
        let currentIndex = (this.head + 1) % this.sortArray.getSize()
        if(this.indexLength == 0){
            currentIndex = 0;
        }
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex),
            this.sortArray.getCY(currentIndex),
            this.getAnimationSpeed()
        );
        await this.pause(undefined);
        if(this.indexLength == 0){
            
            this.sortArray.addArrow(0, "Head", "#C00");
            this.head = 0;
            await this.pause("Creating Head pointer");
            this.sortArray.addArrow(0, "Tail", "#4F0");
            this.tail = 0;
            await this.pause("Creating Head pointer");
        }
        else{
            this.head = currentIndex;
            this.sortArray.moveArrow("Head", currentIndex);
            await this.pause("insert.movePointer", "Head");
        }

        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.indexLength++;
        this.sortArray.setIndexHighlight(currentIndex, false);

        await this.pause(undefined);
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
        const index = this.tail;
        if(index >= 0){
            await this.pause("delete.delete");
            this.sortArray.setIndexHighlight(index, true);
            this.sortArray.setIndexHighlight(index, false);
            this.sortArray.setValue(index, "");
            this.indexLength--;
            if(this.indexLength != 0){
                await this.pause("delete.movePointer", "Tail");
                this.sortArray.moveArrow("Tail", (index + 1) % this.sortArray.getSize());
            }
            else{
                await this.pause("delete.removePointer", "Head");
                this.head = 0;
                this.sortArray.removeArrow("Head");
                await this.pause("delete.removePointer", "Tail");
                this.tail = 0;
                this.sortArray.removeArrow("Tail");
            }
            
            this.tail = (this.tail + 1) % this.sortArray.getSize();
            if(this.indexLength != 0 && this.indexLength <= this.sortArray.getSize() / 4){
                await this.pause("Array is less than 1/4 full!");
                await this.resize(this.sortArray.getSize() / 2);
            }
        }
        await this.pause(undefined);

    }
    
    async print() {
        throw new Error("Print not implemented");
    }
}
