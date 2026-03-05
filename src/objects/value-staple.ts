import { G, Rect, Text } from "@svgdotjs/svg.js";

export class ValueStaple extends G {
    $textGap: number = 5;

    $rect: Rect;
    $text: Text;
    $value: number;

    // stapleWidth and hideText is always set by the setStapleWidth method,
    // hence the assertion that the property is initialized
    $stapleWidth!: number;
    $hideText!: boolean;

    $stapleHeight: number;

    /**
     * Also call {@link init()} to finalize initialization
     */
    constructor(value: number, stapleWidth: number, stapleHeight: number) {
        super();
        this.$value = value;
        this.$text = this.text(String(value));
        
        this.$rect = this.rect(stapleWidth, stapleHeight).fill('#32a852');
        this.$stapleHeight = stapleHeight; // TODO: Make height percentage logic part of the array (single staple shouldn't have max height/percentage)
        this.setStapleWidth(stapleWidth);
        this.addClass("valueStaple")
    }

    /**
     * To finish initialization you should call the init method after the element
     * has been added to the DOM.
     * This method should also be called each time the size of the staples change,
     * to make sure that the text and rectangle are properly aligned.
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

        this.$rect.center(0, 0).dy(-(this.$stapleHeight) / 2);

        return this;
    }

    getValue(): number {
        return this.$value;
    }

    getStapleWidth(): number {
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

    setStapleWidth(width: number): this {
        this.$stapleWidth = width;
        this.$hideText = width < 25
        this.$rect.width(width);
        return this;
    }
}
