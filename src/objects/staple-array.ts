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
     * Also call {@link init()} to finalize initialization
     */
    constructor(
        items: number[],
        stapleMaxHeight: number,
        stapleWidth: number = 25
    ) {
        super();
        this.$stapleMaxHeight = stapleMaxHeight;
        this.$stapleWidth = stapleWidth;

        this.STAPLE_GAP = Math.max(1, Math.round(0.1 * stapleWidth));

        this.$maxValue = Math.max(...items);
        this.createStaples(items).forEach((item: ValueStaple) => {
            this.add(item);
            this.$staples.push(item);
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
        this.$boundingBox?.remove()
        this.$boundingBox = this.rect(
            Math.max(
                0, // Prevent negative widths when there are no staples in the array
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

    swap(i: number, j: number) {
        const iStaple = this.$staples[i];
        const jStaple = this.$staples[j];

        // Move staples to the correct position in the array
        this.$staples.splice(i, 1, jStaple);
        this.$staples.splice(j, 1, iStaple);

        this.engine().animate(iStaple).x(this.getStapleX(j));
        this.engine().animate(jStaple).x(this.getStapleX(i));
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

        if (hasNewMaxValue) { // TODO: probably needs to run this no matter what
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
        this.removeValues(0, this.$staples.length)
    }
    
    delete() {
        this.remove();
    }

    getValues() {
        return this.$staples.map((staple) => staple.getValue());
    }

    getValue(index: number): number {
        return this.$staples[index].getValue();
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

    private getStapleX(i: number): number {
        return Number(this.x()) + (this.$stapleWidth + this.STAPLE_GAP) * i;
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
        this.$maxValue = Math.max(...values);
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

    setStapleHighlight(i: number, type: 'primary' | 'secondary' | 'tertiary' = 'primary') {
        this.$staples[i].$rect.addClass(`${type}Highlight`);
    }

    clearStapleHighlight(i: number, type: 'primary' | 'secondary' | 'tertiary' | 'all' = 'primary') {
        if (type === 'all') {
            this.$staples[i].$rect.removeClass(`primaryHighlight`)
            this.$staples[i].$rect.removeClass(`secondaryHighlight`)
            this.$staples[i].$rect.removeClass(`tertiaryHighlight`)
        } else {
            this.$staples[i].$rect.removeClass(`${type}Highlight`)
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
