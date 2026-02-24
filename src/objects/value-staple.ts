import { G, Rect, Text } from "@svgdotjs/svg.js";

export default class ValueStaple extends G {
    $stapleMaxHeight: number = 100;
    $stapleWidth: number = 20;
    $textGap: number = 5;

    $rect: Rect;
    $text: Text;
    $hideText: boolean;
    $value: number;
    $heightPercentage: number;

    /**
     * Also call {@link init()} to finalize initialization
     */
    constructor(value: number, heightPercentage: number, hideText: boolean = false) {
        if (heightPercentage < 0 || heightPercentage > 1) {
            throw Error(`heightPercentage must be between 0 and 1, inclusive, but was ${heightPercentage}`)
        }
        super();
        this.$value = value;
        this.$heightPercentage = heightPercentage; // TODO: Make height percentage logic part of the array (single staple shouldn't have max height/percentage)
        this.$text = this.text(String(value));
        this.$hideText = hideText;

        this.$rect = this.rect(this.$stapleWidth, this.$stapleMaxHeight * heightPercentage).fill('#32a852');
    }

    /**
     * To finish initialization you should call the init method after the element
     * has been added to the DOM.
     *
     * Positioning the group before it has finished initializing is not possible,
     * which is why this separate method is needed.
     */
    init() {
        this.$text.center(0, 0).dy(this.$textGap);
        if (this.$hideText) {
            this.$text.hide();
        }

        // Translate text down by half its height
        this.$text.node.style.transformBox = 'border-box';
        this.$text.node.style.transform = 'translateY(50%)';

        this.$rect.center(0, 0).dy(-(this.$stapleMaxHeight * this.$heightPercentage) / 2);

        return this;
    }

    getValue(): number {
        return this.$value;
    }

    getStapleWidth(): number {
      console.log(this.$stapleWidth)
        return this.$stapleWidth;
    }

    hideText() {
        this.$hideText = true;
        this.$text.hide();
    }

    showText() {
        this.$hideText = false;
        this.$text.show();
    }

    stapleSize(size: number) {
        this.$stapleWidth = size;
        this.$hideText = size < 20
        this.$rect.width(this.$stapleWidth);
        return this;
    }
}
