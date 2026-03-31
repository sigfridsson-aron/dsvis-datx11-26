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
        traverse: () => 'Find end of bucket'
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

export class HashTableSeparateChaining extends Engine implements Collection {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: hashTable;
    baseSize: number = 28;
    messages: MessagesObject = SortMessages;
    elementCounter: number = 0

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new hashTable(0, this.getObjectSize(), false); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        const [x, y] = this.getTreeRoot();
        /* this.sortArray.$center = [x, y - this.$Svg.margin * 1.5]; */
        this.elementCounter = 0;
        //const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new hashTable(8, this.getObjectSize(), false)
        ).init(8, x, y /* + this.$Svg.margin * 1.5 */)//.setSize(8);
        console.log([x, y])
        
        for(let i=0; i < 8; i++){
            this.sortArray.addLinkedNode(i);
            this.sortArray.$nodeArrays[i][0].opacity(0)
        }

        
        /* this.sortArray.$center = [x, y - this.$Svg.margin * 1.5]; */
        /* this.sortArray.center(
            x,
            y //+ this.$Svg.margin * 1.5
        ); */
        
        /* this.sortArray.y(
            this.getTreeRoot()[1] + this.$Svg.margin * 1.5
        ); */
        //this.Svg.put(this.sortArray);

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

    async resize(length: number){
        const [xRoot, yRoot] = this.getTreeRoot();
        const objectSize = this.getObjectSize();
        const margin = this.$Svg.margin;

        const newArray = this.Svg.put(
            new hashTable(
                this.sortArray.getSize(), 
                objectSize, 
                false
            )
        ).init(0, xRoot, yRoot + margin * 1.5 + objectSize + Number(this.sortArray.height()));
        newArray.setSize(length);
            
        await this.pause("copy.newSize", length);

        // TODO

        for(let i=0; i < newArray.getSize() ; i++){
            newArray.addLinkedNode(i);
            newArray.$nodeArrays[i][0].opacity(0)
        }

        await this.pause("Copy values to the new array");
        let values:Array<string> = []
        for(let i = 0; i < this.sortArray.getSize(); i++){
            values = values.concat(this.sortArray.getValues(i).slice(1));
        }

        //////////////////////////////////
        for(const value of values){
            const arrayLabel = this.Svg.put(
                new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
            ).init(...this.getNodeStart());
            await this.pause("insert.value", value);

            let currentIndex = this.hashString(value) % newArray.getSize();
            
            const chainLength = newArray.$nodeArrays[currentIndex].length;
            const spacing = this.getObjectSize() * 3;

            newArray.setIndexHighlight(currentIndex, true);

            await this.pause("insert.traverse");

            arrayLabel.setCenter(
                newArray.getCX(currentIndex) + spacing * (chainLength),
                newArray.getCY(currentIndex),
                this.getAnimationSpeed()
            );
            newArray.addLinkedNode(currentIndex, value);
            await this.pause("Found empty index");
            arrayLabel.remove();
            
            await this.pause(undefined);

            newArray.setIndexHighlight(currentIndex, false);

            await this.pause(undefined);

        }
        
        //////////////////////

        this.sortArray.remove();
        this.sortArray = newArray;
        //const [x, y] = this.getTreeRoot();
        //this.sortArray.$center = [x, y + this.$Svg.margin * 1.5]; 

        this.animate(this.sortArray, !this.state.isResetting()).center(
            xRoot,
            yRoot + this.$Svg.margin * 1.5
        ); 
        
        await this.pause(undefined);
    }

    async insertOne(value: number | string) {
        if(this.elementCounter >= this.sortArray.getSize() * 0.75){ // Loadfactor
            await this.pause("Load Factor exceeded!");
            await this.resize(this.sortArray.getSize() * 2);
        }
        

        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);

        let currentIndex = this.hashString(value) % this.sortArray.getSize();
        
        const chainLength = this.sortArray.$nodeArrays[currentIndex].length;
        const spacing = this.getObjectSize() * 2.5;

        this.sortArray.setIndexHighlight(currentIndex, true);

        await this.pause("insert.traverse");
        for (let i = 0; i < this.sortArray.$nodeArrays[currentIndex].length; i++){
            this.sortArray.$nodeArrays[currentIndex][i].children().forEach((child) => child.setHighlight(true));
        }
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex) + spacing * (chainLength),
            this.sortArray.getCY(currentIndex),
            this.getAnimationSpeed()
        );
        this.sortArray.addLinkedNode(currentIndex, value);
        this.elementCounter++
        await this.pause("Found empty index");
        arrayLabel.remove();

        for (let i = 0; i < this.sortArray.$nodeArrays[currentIndex].length; i++){
            this.sortArray.$nodeArrays[currentIndex][i].children().forEach((child) => child.setHighlight(false));
        }
        
        await this.pause(undefined);

        

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
        let curIndex = this.hashString(value) % this.sortArray.getSize();
        this.sortArray.setIndexHighlight(curIndex, true);
        await this.pause("find.read", curIndex);
        /* while(this.metadataArray[curIndex] != 0 ){
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
        } */
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
                /* this.metadataArray[index] = 1; */
                this.sortArray.setIndexHighlight(index, false);
                
            }
            await this.pause(undefined);
        }


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
