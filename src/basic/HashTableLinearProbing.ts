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
    },
    find: {
        start: (element: string | number) => `Searching for ${element}`,
        found: (element: string | number) => `Found ${element}`,
        notfound: (element: string | number) => `Did not find ${element}`,
        lookStart: (index: string | number) =>
            `Looking into index: ${index}`,
        look: (index: string | number) =>
            `Looking into the next index: ${index}`,
        read: (element: string | number) =>
            `Reading the value of the index: ${element}`,
        nonExistent: (element: string | number) =>
            `Element ${element} does not exist`,
        notEmpty: (index: number) => `Index: ${index} is not empty`,
    },
    copy: {
        index: (index: number) => `Copying to index: ${index}`,
        newSize: (size: number) => `Creating new Hash Table of length: ${size}`,
    },
    delete: {
        delete: (value: string) => `Deleting ${value}`,
    },
} as const satisfies MessagesObject;

export class HashTableLinearProbing extends Engine implements Collection {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: hashTable;
    metadataArray: number[] = []; // metadata array of the same length as the hash table. 0 = empty, 1 = removed, 2 = filled
    loadFactor: number = 0;
    baseSize: number = 28;
    usinghash: number = 0;
    messages: MessagesObject = SortMessages;
    

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new hashTable(0, this.getObjectSize()); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.usinghash = 0;
        this.loadFactor = 0;
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
        this.metadataArray = Array(8).fill(0);
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
        let newmetaArray = Array(length).fill(0);
        newArray.center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 4 + this.getObjectSize() * 4
        );
        newArray.y(this.getTreeRoot()[1] + this.$Svg.margin * 1.5 + this.getObjectSize() + Number(this.sortArray.height()));
            
        await this.pause("copy.newSize", length);


        await this.pause("Copy values to the new array");

        for(let i = 0; i < this.sortArray.getSize(); i++){
            let val = this.sortArray.getValue(i)
            if(this.metadataArray[i] == 2){
                const arrayLabel = this.Svg.put(
                    new TextCircle(val, this.getObjectSize(), this.getStrokeWidth())
                ).init(this.sortArray.getCX(i), this.sortArray.getCY(i));

                let newIndex = await this.hash(val, newArray);

                await this.pause("copy.index", newIndex);

                newArray.setIndexHighlight(newIndex, true); //rehash and prob when resizing

                await this.pause("find.lookStart", newIndex);
                while(newmetaArray[newIndex] == 2){
                    await this.pause("find.notEmpty", newIndex);
                    console.log(newArray.getValue(newIndex));
                    newArray.setIndexHighlight(newIndex, false);
                    newIndex = (newIndex + 1) % newArray.getSize();
                    newArray.setIndexHighlight(newIndex, true);
                    await this.pause("find.look", newIndex);
                }
                await this.pause("Found empty index");


                newArray.setIndexHighlight(newIndex, false);

                arrayLabel.setCenter(
                newArray.getCX(newIndex),
                newArray.getCY(newIndex),
                this.getAnimationSpeed()
                );

                await this.pause(undefined);

                arrayLabel.remove();
                    
                newArray.setValue(newIndex, val);
                newmetaArray[newIndex] = 2;
            }
        }

        this.sortArray.remove();
        this.sortArray = newArray;
        this.metadataArray = newmetaArray;
        this.animate(this.sortArray, !this.state.isResetting()).center(
        this.getTreeRoot()[0],
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );
        this.animate(this.sortArray, !this.state.isResetting()).y(
        this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        );


        await this.pause(undefined);
    }

    async giveEngineLength(): Promise<number> {
        const dropdown = document.getElementById("hashFunction") as HTMLSelectElement;
        console.log("bruh: " + dropdown.value);
        this.usinghash = Number(dropdown.value);

        return this.sortArray.getSize();
        
    }
    async insertOne(value: number | string) {
        
        if(this.loadFactor >= this.sortArray.getSize() * 0.75){
            await this.pause("Load Factor exceeded!");
            await this.resize(this.sortArray.getSize() * 2);
        }
        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);

        let currentIndex = await this.hash(value, this.sortArray);

        this.sortArray.setIndexHighlight(currentIndex, true);
        await this.pause("find.lookStart", currentIndex);
        while(this.metadataArray[currentIndex] == 2){
            await this.pause("find.notEmpty", currentIndex);
            console.log(this.sortArray.getValue(currentIndex));
            this.sortArray.setIndexHighlight(currentIndex, false);
            currentIndex = (currentIndex + 1) % this.sortArray.getSize();
            this.sortArray.setIndexHighlight(currentIndex, true);
            await this.pause("find.look", currentIndex);
        }
        await this.pause("Found empty index");
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex),
            this.sortArray.getCY(currentIndex),
            this.getAnimationSpeed()
        );
        
        await this.pause(undefined);

        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        if(this.metadataArray[currentIndex] == 0){this.loadFactor++};
        this.metadataArray[currentIndex] = 2;
        this.sortArray.setIndexHighlight(currentIndex, true);
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
        value = String(value)
        let curIndex = await this.hash(value, this.sortArray);
        this.sortArray.setIndexHighlight(curIndex, true);
        await this.pause("find.read", curIndex);
        while(this.metadataArray[curIndex] != 0 ){
            if(this.metadataArray[curIndex] == 2 && value == this.sortArray.getValue(curIndex)){
                await this.pause("find.found", value);
                this.sortArray.setIndexHighlight(curIndex, false);
                return curIndex;
            }
            else{
                await this.pause("find.notfound", value); //not found
                this.sortArray.setIndexHighlight(curIndex, false);
                curIndex = (curIndex + 1) % this.sortArray.getSize();
                this.sortArray.setIndexHighlight(curIndex, true);
                await this.pause("find.look", curIndex);
            }
        }
        this.sortArray.setIndexHighlight(curIndex, false);
        await this.pause("find.nonExistent", value);
        return null;
    }

    async delete(value: string | number): Promise<void> {
        if(value != undefined){
            const index = await this.findOne(value);
            if(index){
                this.sortArray.setIndexHighlight(index, true);
                await this.pause("delete.delete");
                this.sortArray.setValue(index, "DEL");
                this.metadataArray[index] = 1;
                this.sortArray.setIndexHighlight(index, false);
                this.sortArray.setDisabled(index, true);
                
            }
            await this.pause(undefined);
        }


    }
    

    async hash(value: string, arr: hashTable): Promise<number> {
        const hashingText = this.Svg.text(String(this.hashString(value)))
        hashingText.font({size: this.getObjectSize() * 0.37});
        hashingText.fill("#C00"); 
        hashingText.center(this.getNodeStart()[0], this.getNodeStart()[1]);
        this.animate(hashingText, !this.state.isResetting()).center(this.getNodeStart()[0], this.getNodeStart()[1] + this.getObjectSize() * 2);

        await this.pause(undefined)
        
        let currentIndex = this.hashString(value) % arr.getSize();

        hashingText.text(String(currentIndex));
        hashingText.center(this.getNodeStart()[0], this.getNodeStart()[1] + this.getObjectSize() * 2);

        
        await this.pause(undefined)

        this.animate(hashingText, !this.state.isResetting()).center(arr.getCX(currentIndex), arr.getCY(currentIndex) + this.getObjectSize() * 0.8);

        await this.pause(undefined)
        
        hashingText.remove();

        return currentIndex;
    }

    async print() {
        throw new Error("Print not implemented");
    }

    hashString(str: string): number {
        let hash = 0;
        if(this.usinghash == 0){
            for (let i = 0; i < str.length; i++) {
              hash = (hash * 31 + str.charCodeAt(i)); 
            }
        }
        else if(this.usinghash == 1){
            hash = str.charCodeAt(0);
        }
        else if(this.usinghash == 2){
            for (let i = 0; i < str.length; i++) {
              hash = hash + str.charCodeAt(i); 
            }
        }
        return hash;
    }
}
