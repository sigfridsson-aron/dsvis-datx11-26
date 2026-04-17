import { Engine, MessagesObject } from "~/engine";
import { hashTable } from "~/basic/hashTable";
import { TextCircle } from "~/objects/text-circle";
import { Collection } from "~/collections";
import { Svg as SvgElement } from '@svgdotjs/svg.js';

export const SortMessages = {
    insert: {
        value: (value: string) => `Insert value: ${value}`,
        hash: (value : string, hash: string) => `Hash value of ${value}: ${hash}`,
        mod: (value: string) => `Mod hash value by length of hash table: ${value}`,
        insertAt: (value: string) => `Insert at en of bucket index ${value}`,
    },
    hash:{
        hash: (value : string, hash: string) => `Hash value of ${value}: ${hash}`,
        mod: (value: string) => `Mod hash value by length of hash table: ${value}`,
    },    
    find: {
        start: (element: string | number) => `Searching for ${element}`,
        found: (element: string | number) => `Found ${element}`,
        notfound: (element: string | number) => `Did not find ${element}`,
        lookStart: (index: string | number) => `Looking into bucket index: ${index}`,
        look: (index: string | number) => `Looking into index: ${index}`,
        read: (element: string | number) => `Reading the value of the index: ${element}`,
        nonExistent: (element: string | number) => `Element ${element} does not exist`,
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
    sortArray: hashTable;
    baseSize: number = 8;
    usinghash: number = 0;
    messages: MessagesObject = SortMessages;
    elementCounter: number = 0;
    maxLoadFactor: number = 0.75;

    constructor(containerSelector: string) {
        super(containerSelector);
        this.sortArray = new hashTable(this.baseSize, this.getObjectSize(), false); // Only added to make sure that sortArray never is null
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    /*** Resets the canvas */
    async resetAlgorithm() {
        await super.resetAlgorithm();
        const objectSize = this.getObjectSize();
        const [x, y] = [this.$Svg.margin*6, this.$Svg.margin*3 + objectSize*this.baseSize/2];
    
        this.elementCounter = 0;
        this.sortArray = this.Svg.put(
            new hashTable(this.baseSize, objectSize, false)
        ).init(this.baseSize, x, y)
        
        for(let i=0; i < this.baseSize; i++){
            this.sortArray.addLinkedNode(i);
            this.sortArray.$nodeArrays[i][0]
        }

        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
    }
    
    /*** Inserts one or more values into the hashtable */
    async insert(...values: Array<number | string>) {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    /*** Creates a new hashtable below the old one and 
     * transfers the values over from the old table to the new before deleting old table */
    async resize(length: number){
        const objectSize = this.getObjectSize();
        const margin = this.$Svg.margin;
        const [xRoot, yRoot] = [margin*6, margin*3 + objectSize*length/2];

        const newArray = this.Svg.put(
            new hashTable(
                length, 
                objectSize, 
                false
            )
        ).init(length, xRoot, yRoot + objectSize*(length/2 + 1));
            
        await this.pause("copy.newSize", length);

        for(let i=0; i < newArray.getSize() ; i++){
            newArray.addLinkedNode(i);
            newArray.$nodeArrays[i][0]
        }

        await this.pause("Copy values to the new array");
        let values:Array<string> = []
        for(let i = 0; i < this.sortArray.getSize(); i++){
            values = values.concat(this.sortArray.getValues(i).slice(1));
        }

        for(const value of values){
            const arrayLabel = this.Svg.put(
                new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
            ).init(...this.getNodeStart());
            await this.pause("insert.value", value);

            const hash = this.hashString(value);
            await this.pause("hash.hash", value, hash);

            let currentIndex = hash % newArray.getSize();
            
            
            const chainLength = newArray.$nodeArrays[currentIndex].length;
            const spacing = this.getObjectSize()*3;

            newArray.setIndexHighlight(currentIndex, true);

            await this.pause("hash.mod", currentIndex);
            
            arrayLabel.setCenter(
                newArray.getCX(currentIndex) + spacing * (chainLength),
                newArray.getCY(currentIndex),
                this.getAnimationSpeed()
            );

            newArray.addLinkedNode(currentIndex, value);

            await this.pause("insert.insertAt", String(currentIndex));
            arrayLabel.remove();
            
            await this.pause(undefined);

            newArray.setIndexHighlight(currentIndex, false);

            await this.pause(undefined);

        }
        
        this.sortArray.remove();
        this.sortArray = newArray;
        await this.pause("Remove old table");

        this.sortArray.dMoveCenter(
            0,
            -objectSize*(length/2 + 1)
        ); 
        
        await this.pause(undefined);
    }
    /*** Insert one value into the hashtable */
    async insertOne(value: number | string) {
        if(this.elementCounter >= this.sortArray.getSize() * this.maxLoadFactor){ // Loadfactor
            await this.pause("Load Factor exceeded!");
            await this.resize(this.sortArray.getSize() * 2);
        }
        value = String(value);
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);

        const hash = this.hashString(value);
        await this.pause("hash.hash", value, hash);

        let currentIndex = hash % this.sortArray.getSize();
        
        
        const chainLength = this.sortArray.$nodeArrays[currentIndex].length;
        const spacing = this.getObjectSize() * 3;

        this.sortArray.setIndexHighlight(currentIndex, true);

        await this.pause("hash.mod", currentIndex);
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
        await this.pause("insert.insertAt", String(currentIndex));
        arrayLabel.remove();

        for (let i = 0; i < this.sortArray.$nodeArrays[currentIndex].length; i++){
            this.sortArray.$nodeArrays[currentIndex][i].children().forEach((child) => child.setHighlight(false));
        }
        this.sortArray.setIndexHighlight(currentIndex, false);
    }

    /*** Find one or more values in the hashtable and returning their position */
    async find(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.findOne(val);
        }
    }
    
    /*** Find one value in the hashtable and returning its position */
    async findOne(value: string | number): Promise<[number,number] | null> {
        await this.pause("find.start", value); //start the search
        value = String(value)
        const hash = this.hashString(value);
        let curIndex = hash % this.sortArray.getSize();
        await this.pause("hash.hash",value, String(hash));
        await this.pause("hash.mod", curIndex);
        await this.pause("find.read", curIndex);
        ////////////////////////
        await this.pause("find.lookStart", curIndex);
        for (let i = 1; this.sortArray.$nodeArrays[curIndex].length;i++){
            this.sortArray.$nodeArrays[curIndex][i].setHighlight(true);
            await this.pause("find.look", i);
            if(String(this.sortArray.$nodeArrays[curIndex][i].value) == value){
                await this.pause("find.found", i);
                this.sortArray.$nodeArrays[curIndex][i].setHighlight(false);
                return [curIndex, i]
            }
            this.sortArray.$nodeArrays[curIndex][i].setHighlight(false);
        }
        ///////////////////////
        
        await this.pause("find.notFound", value);
        return null;
    }

    /*** Deletes value if found */
    async delete(value: string | number): Promise<void> {
        if(value != undefined){
            const indexes = await this.findOne(value);
            if(indexes){
                this.sortArray.removeLinkedNode(...indexes)
                await this.pause("delete.delete", value);
                this.elementCounter--
            }
            await this.pause(undefined);
        }
    }
    
    /*** Idk */
    async print() {
        console.log("Print not implemented");
    }
    
    /*** Returns hashed value based on current hashmethod */
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
