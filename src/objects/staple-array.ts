import { G } from "@svgdotjs/svg.js";
import { ValueStaple } from "~/objects/value-staple";

export class StapleArray extends G {
    STAPLE_GAP: number = 1;

    $staples: ValueStaple[] = [];
    $stapleMaxHeight: number;
    $stapleWidth: number;
    $maxValue: number;
    $stapleSize: number;

    constructor(items: number[], stapleMaxHeight: number, stapleWidth: number = 25) {
        super();
        this.$stapleMaxHeight = stapleMaxHeight;
        this.$stapleWidth = stapleWidth;
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
        this.$staples.forEach((staple, i) => {
            staple.init();
            staple.dx((this.STAPLE_GAP + staple.getStapleWidth()) * i);
        });
        this.center(centerX, centerY);

        // setTimeout(() => {
        //     this.swap(10, 20);
        // }, 1000);
        // setTimeout(() => {
        //     this.shuffle();
        // }, 5000);
        return this;
    }

    shuffle() {
        const tmpStaples: ValueStaple[] = [];
        while (this.$staples.length > 0) {
            const i: number = Math.floor(Math.random() * this.$staples.length);
            tmpStaples.push(...this.$staples.splice(i, 1));
        }
        this.$staples = tmpStaples;
        this.init(this.cx(), this.cy());
    }

    swap(i: number, j: number) {
        const iStaple = this.$staples[i];
        const jStaple = this.$staples[j];
        const iPosition = { x: iStaple.x(), y: iStaple.y() };

        // Move staples to the correct position in the array
        this.$staples.splice(i, 1, jStaple);
        this.$staples.splice(j, 1, iStaple);

        this.engine().animate(iStaple).x(Number(jStaple.x()));
        this.engine().animate(jStaple).x(Number(iPosition.x));
    }

    length(): number {
        return this.$staples.length;
    }

    addValues(...values: number[]) {
        const currentCenter = { x: this.cx(), y: this.cy() }
        let hasNewMaxValue: boolean = true;
        for (const value of values) {
            if (value > this.$maxValue) {
                hasNewMaxValue = true;
                this.$maxValue = value;
            }
            const staple = new ValueStaple(value, this.$stapleWidth, this.$stapleMaxHeight * (value / this.$maxValue));
            this.$staples.push(staple);
            this.add(staple)
        }
        console.debug(this.$staples);
        console.debug(hasNewMaxValue);
        if (hasNewMaxValue) {
            this.init(currentCenter.x, currentCenter.y);
        }
    }

    getValues() {
        return this.$staples.map((staple) => staple.getValue());
    }

    getValue(index: number): number {
        return this.$staples[index].getValue();
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

    setStapleHighlight(i: number) {
        this.$staples[i].setHighlight(true);
    }

    clearStapleHighlight(i: number) {
        this.$staples[i].setHighlight(false);
    }
}
