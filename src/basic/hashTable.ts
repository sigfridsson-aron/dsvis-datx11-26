import { G, Rect, Text, Svg } from '@svgdotjs/svg.js';
import { NBSP } from "~/engine";
import { Polyline } from "@svgdotjs/svg.js";
import { LinkedNode } from "~/objects/basic-structure-objects/linked-node";
import { LinkedConnection } from "~/objects/basic-structure-objects/node-connection";
import { Connection } from '../objects/connection';

export class hashTable extends G {
    $horizontal: boolean; // Make it do stuff
    
    $nodeArrays: LinkedNode[][] = []; // Used for vertical
    $connections: LinkedConnection[][] = [];
    $bound: Rect | undefined; // Used for coordinates

    $backgrounds: Rect[] = [];
    $values: Text[] = [];
    $indices: Text[] = [];

    constructor(size: number, objectSize: number, horizontal: boolean = true) {
        super();
        this.$horizontal = horizontal; 
        this.$values = new Array(size)
        this.$bound = new Rect();
        if (!horizontal){
            this.$bound = this.rect(2 * objectSize, objectSize * size)//.addClass("invisible")
        }
    }

    /** */
    init(size: number, x: number, y: number) {
        if (this.$bound){
            this.$bound.center(x, y);
        }
        this.setSize(size);
        this.clear();
        return this;
    }


    /** Returns number of elements that fit in a row*/ 
    getRowWidth() : number {
        if(this.$horizontal){
            return Math.floor((this.engine().$Svg.width - 7 * this.engine().$Svg.margin + 10) / (this.engine().getObjectSize() * 2));
        }else{
            return 1;
        }
        
    }

    /** Calculates the x-coordinate based on index*/ 
    getCX(i: number): number {
        const maxPerLine = this.getRowWidth();
        const lineSize = Math.min(this.getSize(), maxPerLine);
        const objectSize = this.engine().getObjectSize() * 2;

        if (this.$horizontal || !this.$bound) {
            // Horizontal layout
            const col = i % maxPerLine;
            return this.cx() + objectSize * (col - lineSize / 2 + 0.5);
        } else {
            // vertical layout

            return this.$bound.cx() /* + objectSize/2 * i*3 */;//Number(this.$bound.x()) + objectSize + objectSize*3*i //Number(this.x()) + objectSize + objectSize*3*i;
        }
    }

    /** Calculates the y-coordinate based on index*/ 
    getCY(i: number): number {
        const maxPerLine = this.getRowWidth();
        const objectSize = this.engine().getObjectSize();

        if (this.$horizontal || !this.$bound) {
            // Horizontal
            const row = Math.floor(i / maxPerLine);
            return Number(this.y()) +  objectSize * 0.5 + objectSize * 2 * row;
        } else {
            // Vertical
            return Number(this.$bound.y()) + objectSize/2 + objectSize*i//Number(this.y()) + objectSize/2 + objectSize*i;
        }
    }

    /** Returns total length of array// not number of values currently in the table*/
    getSize(): number {   
        return this.$values.length;    
    }

    /** What it do?*/
    setSize(size: number) {
        while (size < this.getSize()) {
            this.$backgrounds.pop()?.remove();
            this.$values.pop()?.remove();
            this.$indices.pop()?.remove();
        }

        const cellWidth = this.engine().getObjectSize() * 2;
        const cellHeight = this.engine().getObjectSize();
        const rowWidth = Math.min(size, this.getRowWidth());
        const stroke = this.engine().getStrokeWidth();

        const cx = this.cx();
        let cy =  this.cy();

        if (!this.$horizontal) {
            this.$nodeArrays = new Array(size).fill(null).map(() => []);
            this.$connections = new Array(size).fill(null).map(() => []);
        }

        for (let i = 0; i < size; i++) {
            const x:number = this.getCX(i);
            const y:number = this.getCY(i);

            if(this.$horizontal){
                if(i % this.getRowWidth() == 0 && i != 0){
                    cy = cy + this.engine().getObjectSize() * 2; 
                }

                if (!this.$backgrounds[i]) {
                    this.$backgrounds[i] = this.rect(cellWidth, cellHeight)
                        .stroke({ width: stroke })
                        .addClass("background");
                }
                this.$backgrounds[i].center(cx + cellWidth * (i % this.getRowWidth() - rowWidth / 2 + 0.5), cy);

                if (!this.$values[i]) {
                    this.$values[i] = this.text(NBSP);
                }
                this.$values[i].center(cx + cellWidth * (i % this.getRowWidth() - rowWidth / 2 + 0.5), cy);

                if (!this.$indices[i]) {
                    this.$indices[i] = this.text(i.toString()).addClass(
                        "arrayindex"
                    );
                }
                this.$indices[i].center(
                    cx + cellWidth * (i % this.getRowWidth() - rowWidth / 2 + 0.5),
                    cy + cellHeight * 0.8
                );
            }else{
            } 
            
        }
        return this;
    }

    addLinkedNode(index:number, value:string =""):LinkedNode{
        const nodeDimensions: [number, number] = [this.engine().getObjectSize() * 2, this.engine().getObjectSize()];
        const newNode = new LinkedNode(value, nodeDimensions, this.engine().getStrokeWidth())
        this.add(newNode);
        newNode.center(this.getCX(index) + this.engine().getObjectSize()*3* (this.$nodeArrays[index].length), this.getCY(index));
        
        this.$nodeArrays[index].push(newNode);
        if(this.$nodeArrays[index].length > 1){
            const previousNode = this.$nodeArrays[index][this.$nodeArrays[index].length-2];
            const linkedConnection = new LinkedConnection(
                previousNode, 
                newNode, 
                nodeDimensions, 
                this.engine().getStrokeWidth(), 
                this.engine().Svg
            );
            this.add(linkedConnection);
            this.$connections[index].push(linkedConnection);
        }
        return newNode;
    }

    async removeLinkedNode(arrayindex: number, linkedindex:number){
        const nextNode = this.$nodeArrays[arrayindex][linkedindex+1] as LinkedNode;
        const prevConnection = this.$connections[arrayindex][linkedindex-1] as LinkedConnection; 

        this.$nodeArrays[arrayindex][linkedindex].remove();
        this.$nodeArrays[arrayindex].splice(linkedindex, 1);

        if (linkedindex === this.$nodeArrays[arrayindex].length) {
            // If the node is the last one, remove the connection to the previous node
            this.$connections[arrayindex][linkedindex-1].remove();
            this.$connections[arrayindex].splice(linkedindex-1, 1); // Set the connection to null
        } else {
            // If the node is not the last one
            // Remove the connection to the next node
            this.$connections[arrayindex][linkedindex].remove();
            this.$connections[arrayindex].splice(linkedindex, 1);
            // Update the connection of the previous node to go to the next node
            
            this.adjustNodes(arrayindex, linkedindex); 
            /* prevConnection.setEnd(nextNode, this.animationValue()); */
        }
    }

    adjustNodes(arrayindex: number, linkedindex:number){
        const right = this.$nodeArrays[arrayindex].slice(linkedindex);
        const conright = this.$connections[arrayindex].slice(linkedindex);

        for (const node of right) {
            // Move the node and link to the correct position with animation
            node.dMoveCenter(
                -this.engine().getObjectSize()*3,
                0,
                this.animationValue()
            );

            // Update the connection to the new position
        }
        for (const connection of conright){
            connection.dMoveCenter(
                -this.engine().getObjectSize()*3,
                0,
                this.animationValue()
            );
        }
    }

    private animationValue(): number {
         const animate = !this.engine().state.isResetting()
        return animate ? this.engine().$Svg.animationSpeed : 0;
    }

    /** What it do?*/
    clear() {
        if(this.$horizontal){
            for (let i = 0; i < this.getSize(); i++) {
                this.setValue(i, "");
                this.setDisabled(i, true);
            }
        }

        for (let i = 0; i < this.$nodeArrays.length; i++) {
            for (const node of this.$nodeArrays[i]) {
                node.remove();
            }
            for (const conn of this.$connections[i]) {
                conn.remove();
            }
        }
        
        if (!this.$horizontal) {
            const size = this.getSize();
            this.$nodeArrays = new Array(size).fill(null).map(() => []);
            this.$connections = new Array(size).fill(null).map(() => []);
        }
        return this;
    }

    getValues(i: number): string[]{
        return this.$nodeArrays[i].map(node => String(node.value));
    }

    /** What it do?*/
    getValue(i: number): string {
        return this.$values[i].text();
    }

    /** What it do?*/
    setValue(i: number, text: string) {
        if (this.$horizontal){
            if (text == null) {
                text = "";
            }
            text = `${text}`;
            // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
            if (text === "") {
                text = NBSP;
            }
            this.$values[i].text(text);
            return this;
        }else{
            
        }
        
    }

    /** What it do?*/
    swap(j: number, k: number, animate: boolean = false) {
        const jText = this.$values[j],
            kText = this.$values[k];
        const jX = this.getCX(j),
            kX = this.getCX(k);
        this.engine().animate(jText, animate).cx(kX);
        this.engine().animate(kText, animate).cx(jX);
        this.$values[k] = jText;
        this.$values[j] = kText;
        return this;
    }

    /** What it do?*/
    setDisabled(i: number, disabled: boolean | null) {
        const bg = this.$backgrounds[i];
        if (disabled == null) {
            bg.toggleClass("disabled");
        } else if (disabled) {
            bg.addClass("disabled");
        } else {
            bg.removeClass("disabled");
        }
        return this;
    }

    /** Highlights the value with inserted index*/
    setIndexHighlight(i: number, high: boolean, color: string = "#C00") {
        if (this.$backgrounds[i]) {
            if (high) {
                this.$backgrounds[i].css("stroke", color);
            } else {
                this.$backgrounds[i].css("stroke", "");
            }
        }

        if (this.$values[i]) {
            if (high) {
                this.$values[i].css("fill", color);
            } else {
                this.$values[i].css("fill", "");
            }
        }

        for (const bg of this.$backgrounds) {
            if (!bg.css("stroke")) {
                bg.back();
            }
        }
        return this;
    }

}
