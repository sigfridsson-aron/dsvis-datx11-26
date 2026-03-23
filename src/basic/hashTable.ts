import { G, Rect, Text } from "@svgdotjs/svg.js";
import { NBSP } from "~/engine";
import { Polyline } from "@svgdotjs/svg.js";
import LinkedList from "./LinkedList";

export class hashTable extends G {
    $horizontal: boolean; // Make it do stuff
    $rect: Rect;
    $backgrounds: Rect[] = [];
    $values: Text[] = [];
    //$values: LinkedList<Text>[] = [];
    $indices: Text[] = [];

    constructor(size: number, objectSize: number, horizontal: boolean = true) {
        super();
        this.$horizontal = horizontal; 
        this.$values = new Array(size);
        this.$rect = this.rect(objectSize * size, 3 * objectSize)
            .addClass("invisible")
            .center(0, 0);
    }

    /** What it do?*/
    init(size: number, x: number, y: number) {
        this.setSize(size);
        this.clear();
        this.center(x, y);
        this.y(y);
        return this;
    }


    /** Returns number of elements that fit in a row*/ 
    getRowWidth() : number {
        return Math.floor((this.engine().$Svg.width - this.engine().$Svg.margin) / (this.engine().getObjectSize() * 2));
    }

    /** Calculates the x-coordinate for an object based on its index*/ 
    getCX(i: number): number {
        return (
            this.cx() +
            this.engine().getObjectSize() * 2 * (i % this.getRowWidth() - Math.min(this.getRowWidth(), this.getSize()) / 2 + 0.5)
        );
    }

    /** Calculates the y-coordinate for an object based on its index*/ 
    getCY(i: number): number {
        return (
            Number(this.y()) + this.engine().getObjectSize() * 1.5 + 
            this.engine().getObjectSize() * 2 * (Math.floor((i / this.getRowWidth()))) 
        );
    }

    /** Returns number of values currently in the table (but why have diz function if there is $vales.length?)*/
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

        if(size <= this.getRowWidth()){
            this.$rect.width(cellWidth * size);
        }
        else{
            this.$rect.width(this.engine().$Svg.width - this.engine().$Svg.margin); // Magic numbers (this.engine().$Svg.width - this.engine().$Svg.margin)
        }

        const cx = this.$rect.cx();
        let cy = this.$rect.cy();

        for (let i = 0; i < size; i++) {

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
        }
        return this;
    }


    /** What it do?*/
    clear() {
        for (let i = 0; i < this.getSize(); i++) {
            this.setValue(i, "");
            this.setDisabled(i, true);
        }
        return this;
    }

    // Are these even used?
    /*
    getValues(): Array<string> {
        return this.$values.map((t) => t.text());
    }

    setValues(values: Array<string>) {
        if (values.length !== this.getSize()) {
            throw new Error(
                `Wrong number of values: ${values.length} != ${this.getSize()}`
            );
        }
        for (let i = 0; i < values.length; i++) {
            this.setValue(i, values[i]);
        }
        return this;
    }
    */

    /** What it do?*/
    getValue(i: number): string {
        return this.$values[i].text();
    }

    /** What it do?*/
    setValue(i: number, text: string) {
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

    /** What it do?*/
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

        for (const bg of Object.values(this.$backgrounds)) {
            if (!bg.css("stroke")) {
                bg.back();
            }
        }
        return this;
    }

    // Is this even used?
    /*
    addArrow(index: number, arrowId: string = "arrow", color: string = "#000") {
        const arrowSize = this.engine().getObjectSize() / 3.5;
        const arrowOffset = 10;

        const x = this.getCX(index);
        const y = this.getCY(index) - this.engine().getObjectSize() / 2 - arrowOffset / 2;

        const arrow = this.polyline([
            [x, y],
            [x - arrowSize, y - arrowSize],
            [x + arrowSize, y - arrowSize],
            [x, y],
        ])
            .fill("none")
            .stroke({ width: 2 })
            .id(arrowId);

        arrow.css("stroke", color)
        this.add(arrow);
    }

    removeArrow(arrowId: string) {
        const arrow = this.findOne(`#${arrowId}`) as Polyline | null;
        if (arrow) {
            arrow.remove();
        }
    }

    moveArrow(arrowId: string, indexTo: number) {
        const arrowSize = this.engine().getObjectSize() / 3.5;
        const arrowOffset = 10;
        const arrow = this.findOne(`#${arrowId}`) as Polyline | null;
        const x = this.getCX(indexTo);
        const y = this.getCY(indexTo) - this.engine().getObjectSize() / 2 - arrowOffset / 2- arrowSize / 2;

        if (arrow) {
            this.engine().animate(arrow, true).cx(x);
            this.engine().animate(arrow, true).cy(y);
        }
    }
    */
}
