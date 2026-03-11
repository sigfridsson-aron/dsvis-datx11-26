import { Engine, MessagesObject } from "~/engine";
import { hashTable } from "~/basic/hashTable";
import { TextCircle } from "~/objects/text-circle";
import { Collection } from "~/collections";

export const SortMessages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Pushing value: ${value}`,
        movePointer: (value: string) => `Moving ${value} pointer`
    },
    copy: {
        index: (index: number) => `Copying index: ${index}`,
        newSize: (size: number) => `Creating new Dynamic Array of length:  ${size}`,
    },
    delete: {
        delete: `Popping value at head`,
        removePointer: (value: string) => `Removing ${value} pointer`,
        movePointer: (value: string) => `Moving ${value} pointer`
    },
} as const satisfies MessagesObject;

export class HashTableLinearProbing extends Engine implements Collection {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: hashTable;
    empty: String;
    indexLength: number = 0;
    baseSize: number = 28;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new hashTable(0, this.getObjectSize()); // Only added to make sure that sortArray never is null
        this.empty = "";
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
            new hashTable(8, this.getObjectSize())
        ).init(1, xRoot, yRoot + this.$Svg.margin * 1.5).setSize(8);
        this.sortArray.center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );
        this.sortArray.y(
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );
        this.Svg.put(this.sortArray);
        this.sortArray.setDisabled(0, false);
        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
        this.empty = this.sortArray.getValue(0);
    }

    async insert(...values: Array<number | string>) {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async swap(arr: hashTable, j: number, k: number) {
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
            new hashTable(this.sortArray.getSize(), this.getObjectSize())
        ).init(0, xRoot, yRoot + this.$Svg.margin * 6);
        newArray.setSize(length);
        newArray.center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 4 + this.getObjectSize() * 4
        );
        newArray.y(this.getTreeRoot()[1] + this.$Svg.margin * 1.5 + this.getObjectSize() + Number(this.sortArray.height()));
            
        await this.pause("copy.newSize", length);


        await this.pause("Copy values to the new array");

        for(let i = 0; i < this.sortArray.getSize(); i++){
            let val = this.sortArray.getValue(i)
            if(val != this.empty){
                const arrayLabel = this.Svg.put(
                    new TextCircle(val, this.getObjectSize(), this.getStrokeWidth())
                ).init(this.sortArray.getCX(i), this.sortArray.getCY(i));

                let newIndex = this.hashString(val) % newArray.getSize();

                await this.pause("copy.index", newIndex);

                newArray.setIndexHighlight(newIndex, true); //rehash and prob when resizing

                await this.pause("looking");
                while(newArray.getValue(newIndex) !=  this.empty){
                    await this.pause("not empty");
                    console.log(newArray.getValue(newIndex));
                    newArray.setIndexHighlight(newIndex, false);
                    newIndex = (newIndex + 1) % newArray.getSize();
                    newArray.setIndexHighlight(newIndex, true);
                    await this.pause("go to next");
                }
                await this.pause("is empty");


                newArray.setIndexHighlight(newIndex, false);

                arrayLabel.setCenter(
                newArray.getCX(newIndex),
                newArray.getCY(newIndex),
                this.getAnimationSpeed()
                );

                await this.pause(undefined);

                arrayLabel.remove();
                    
                newArray.setValue(newIndex, val);
            }
        }

        this.sortArray.remove();
        this.sortArray = newArray;
        this.animate(this.sortArray, !this.state.isResetting()).center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );
        this.animate(this.sortArray, !this.state.isResetting()).y(
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );


        await this.pause(undefined);
    }

    async insertOne(value: number | string) {
        if(this.indexLength >= this.sortArray.getSize() * 0.75){
            await this.pause("Load Factor exceeded!");
            await this.resize(this.sortArray.getSize() * 2);
        }
        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);

        let currentIndex = this.hashString(value) % this.sortArray.getSize();
        this.sortArray.setIndexHighlight(currentIndex, true);
        await this.pause("looking");
        while(this.sortArray.getValue(currentIndex) !=  this.empty){
            await this.pause("not empty");
            console.log(this.sortArray.getValue(currentIndex));
            this.sortArray.setIndexHighlight(currentIndex, false);
            currentIndex = (currentIndex + 1) % this.sortArray.getSize();
            this.sortArray.setIndexHighlight(currentIndex, true);
            await this.pause("go to next");
        }
        await this.pause("is empty");
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex),
            this.sortArray.getCY(currentIndex),
            this.getAnimationSpeed()
        );
        
        await this.pause(undefined);

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
        const index = this.indexLength - 1;
        if(index >= 0){
            await this.pause("delete.delete");
            this.sortArray.setIndexHighlight(index, true);
            this.sortArray.setIndexHighlight(index, false);
            this.sortArray.setValue(index, "");
            this.indexLength--;

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

    hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash * 31 + str.charCodeAt(i)) | 0; 
        }
        return hash;
    }
}
