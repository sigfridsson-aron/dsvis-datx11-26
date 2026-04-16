import { G, Rect } from "@svgdotjs/svg.js";
import { ValueStaple } from "~/objects/value-staple";

export class StapleArray extends G {
    STAPLE_GAP: number = 3;

    $boundingBox: Rect | undefined = undefined;
    $staples: ValueStaple[] = [];
    $stapleMaxHeight: number;
    $stapleWidth: number;
    $maxValue: number;

    /**
     * @constructor
     * @description Creates a staple array object. Also call {@link init()} to finalize initialization.
     * Note that init() needs to be called after the staple
     * is added to the DOM.
     * @param values Values to create the staples from
     * @param stapleMaxHeight Height of the tallest staple
     * @param stapleWidth Width of the staples
     * @param maxValue Optional max value to use when calculating the ratio of the staples. If omitted, max(values) is used.
     */
    constructor(
        values: number[],
        stapleMaxHeight: number,
        stapleWidth: number,
        maxValue?: number
    ) {
        super();
        this.$stapleMaxHeight = stapleMaxHeight;
        this.$stapleWidth = stapleWidth;

        this.STAPLE_GAP = Math.max(1, Math.round(0.1 * stapleWidth));

        if (maxValue) {
            this.$maxValue = maxValue;
        } else {
            this.$maxValue = Math.max(...values);
        }
        this.createStaples(values).forEach((value: ValueStaple) => {
            this.add(value);
            this.$staples.push(value);
        });
    }

    /**
     * To finish initialization you should call the init method after the element
     * has been added to the DOM.
     *
     * Positioning the group before it has finished initializing is not possible,
     * which is why this separate method is needed.
     */
    init(centerX: number, centerY: number): this {
        this.$boundingBox?.remove();
        // Width of bounding box can not be 0, then the array
        // won't be positioned in the center when there are no staples in the array
        this.$boundingBox = this.rect(
            Math.max(
                1,
                this.$staples.length * (this.$stapleWidth + this.STAPLE_GAP) -
                    this.STAPLE_GAP // Remove one staple gap to avoid extra gap at the end.
            ),
            this.$stapleMaxHeight
        )
            .center(0, 0)
            .dy(-this.$stapleMaxHeight / 2) // Move bounding box to cover staples
            .height(this.$stapleMaxHeight + 30) // Add size of 30 to cover the text
            .addClass("invisible");
        this.$staples.forEach((staple, i) => {
            staple.init();
        });
        this.positionStaples();
        this.center(centerX, centerY);

        // setTimeout(() => {
        //     this.swap(10, 20);
        // }, 1000);
        // setTimeout(() => {
        //     this.shuffle();
        // }, 5000);
        return this;
    }

    swap(i: number, j: number, animate: boolean = true) {
        const iStaple = this.$staples[i];
        const jStaple = this.$staples[j];

        // Move staples to the correct position in the array
        this.$staples.splice(i, 1, jStaple);
        this.$staples.splice(j, 1, iStaple);

        this.engine().animate(iStaple, animate).x(this.getStapleX(j));
        this.engine().animate(jStaple, animate).x(this.getStapleX(i));
    }

    length(): number {
        return this.$staples.length;
    }

    addValues(...values: number[]) {
        const currentCenter = { x: this.cx(), y: this.cy() };
        let hasNewMaxValue: boolean = false;
        for (const value of values) {
            if (value > this.$maxValue) {
                hasNewMaxValue = true;
                this.$maxValue = value;
            }
            const staple = new ValueStaple(
                value,
                this.$stapleWidth,
                this.$stapleMaxHeight * (value / this.$maxValue)
            );
            this.$staples.push(staple);
            this.add(staple);
        }

        if (hasNewMaxValue) {
            this.resizeStaples();
        }
        this.init(currentCenter.x, currentCenter.y);
    }

    /**
     * Remove a value by its index.
     * This method both removes the element from the staple array,
     * and also removes it from the DOM.
     *
     * @param i index of value to remove
     */
    removeValue(i: number) {
        this.removeValues(i, i + 1);
    }

    /**
     * Remove values by index from start (inclusive) and end (exclusive)
     * This method both removes the elements from the  staple array,
     * and also removes them from the DOM.
     *
     * @param start index of the first value to remove (inclusive)
     * @param end index of the last value to remove (exclusive)
     */
    removeValues(start: number, end: number) {
        this.$staples
            .splice(start, end - start)
            .forEach((value) => value.remove());
    }

    reset() {
        this.removeValues(0, this.$staples.length);
    }

    delete() {
        this.clear();
        this.remove();
    }

    getValues() {
        return this.$staples.map((staple) => staple.getValue());
    }

    getValue(index: number): number {
        return this.$staples[index].getValue();
    }

    getMaxValue(): number {
        return this.$maxValue;
    }

    resizeAndPositionStaples() {
        this.resizeStaples();
        this.positionStaples();
    }

    private resizeStaples() {
        this.$staples.forEach((staple) => {
            staple.setStapleWidth(this.$stapleWidth);
            staple.setStapleHeight(
                this.$stapleMaxHeight * (staple.getValue() / this.$maxValue)
            );
            staple.init();
        });
    }

    getStapleX(i: number): number {
        if (!this.$boundingBox)
            throw new Error("Bounding box has not been initialized when trying to get staple x value")
        return Number(this.$boundingBox.x()) + (this.$stapleWidth + this.STAPLE_GAP) * i;
    }

    getStaple(i: number): ValueStaple {
        return this.$staples[i];
    }

    getStapleWidth(): number {
        return this.$stapleWidth;
    }

    private positionStaples() {
        this.$staples.forEach((staple, i) => {
            // staple.center(0, 0);
            staple.x(this.getStapleX(i));
        });
        // this.center
    }

    private createStaples(values: number[]): ValueStaple[] {
        const staples: ValueStaple[] = [];
        values.forEach((value: number) => {
            const staple: ValueStaple = new ValueStaple(
                value,
                this.$stapleWidth,
                (value / this.$maxValue) * this.$stapleMaxHeight
            );
            staples.push(staple);
        });
        return staples;
    }

    setStapleHighlight(
        i: number,
        type: "primary" | "success" | "info" = "primary"
    ) {
        this.$staples[i].addClass(`${type}Highlight`);
    }

    clearStapleHighlight(
        i: number,
        type: "primary" | "success" | "info" | "all" = "primary"
    ) {
        if (type === "all") {
            this.$staples[i].removeClass(`primaryHighlight`);
            this.$staples[i].removeClass(`successHighlight`);
            this.$staples[i].removeClass(`infoHighlight`);
        } else {
            this.$staples[i].removeClass(`${type}Highlight`);
        }
    }

    setStaplesDisabled(start: number, end: number = this.length()) {
        for (let i = start; i < end; i++) {
            this.$staples[i].addClass("disabled")
        }
    }

    clearStaplesDisabled(start: number, end: number = this.length()) {
        for (let i = start; i < end; i++) {
            this.$staples[i].removeClass("disabled")
        }
    }

    /**
     * Note that this method only sets the new max height, and doesn't
     * resize or position the staples accordingly. To make sure the staples
     * get their correct position and size, always call
     * {@link resizeAndPositionStaples()} afterwards.
     *
     * @param maxHeight height of the staple with the largest value
     * @returns itself
     */
    setStapleMaxHeight(maxHeight: number) {
        this.$stapleMaxHeight = maxHeight;
        return this;
    }

    /**
     * Note that this method only sets the new staple width, and doesn't
     * resize or position the staples accordingly. To make sure the staples
     * get their correct position and size, always call
     * {@link resizeAndPositionStaples()} afterwards.
     *
     * @param maxHeight height of the staple with the largest value
     * @returns itself
     */
    setStapleWidth(stapleWidth: number) {
        this.$stapleWidth = stapleWidth;
        return this;
    }
}
