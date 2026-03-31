import { MessagesObject, NBSP } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { Sorter } from "~/sorting";
import { TreeSorter, SortMessages } from "./TreeSorter";

export const HeapSortMessages = {
    sort: {
        swap: (a: string, b: string) => `Swapping ${a} and ${b}`,
    },
} as const satisfies MessagesObject;

export class HeapSort extends TreeSorter implements Sorter {
    messages: MessagesObject = updateDefault(HeapSortMessages, SortMessages);
    async sort() {
        const sortSize = this.sortArray.length();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }

        // Build max heap
        for (let i = Math.floor(sortSize / 2) - 1; i >= 0; i--) {
            await this.heapify(sortSize, i);
        }

        // Extract max one by one
        for (let i = sortSize - 1; i > 0; i--) {
            const rootValue = String(this.sortArray.getValue(0));
            const endValue = String(this.sortArray.getValue(i));

            this.sortArray.setTreeHighlight(0, "primary");
            this.sortArray.setTreeHighlight(i, "secondary");

            // Pause before swap so highlight is visible
            await this.pause("sort.swap", rootValue, endValue);

            this.sortArray.swap(0, i);

            // Mark sorted tail and clear active highlights
            this.sortArray.clearTreeHighlight(0, "primary");
            this.sortArray.clearTreeHighlight(i, "secondary");
            this.sortArray.setTreesDisabled(i, sortSize);

            await this.heapify(i, 0);
        }

        // Final element is sorted too
        this.sortArray.setTreesDisabled(0, sortSize);
    }

    private async heapify(n: number, i: number) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        // Current root being heapified
        this.sortArray.setTreeHighlight(i, "tertiary");

        // Compare left child
        if (left < n) {
            this.sortArray.setTreeHighlight(left, "primary");
            await this.pause(
                "sort.compare",
                String(this.sortArray.getValue(left)),
                String(this.sortArray.getValue(largest))
            );
            if (Number(this.sortArray.getValue(left)) > Number(this.sortArray.getValue(largest))) {
                largest = left;
            }
            this.sortArray.clearTreeHighlight(left, "primary");
        }

        // Compare right child
        if (right < n) {
            this.sortArray.setTreeHighlight(right, "primary");
            await this.pause(
                "sort.compare",
                String(this.sortArray.getValue(right)),
                String(this.sortArray.getValue(largest))
            );
            if (Number(this.sortArray.getValue(right)) > Number(this.sortArray.getValue(largest))) {
                largest = right;
            }
            this.sortArray.clearTreeHighlight(right, "primary");
        }

        // Swap if needed
        if (largest !== i) {
            const iValue = String(this.sortArray.getValue(i));
            const largestValue = String(this.sortArray.getValue(largest));

            this.sortArray.setTreeHighlight(i, "secondary");
            this.sortArray.setTreeHighlight(largest, "secondary");

            await this.pause("sort.swap", iValue, largestValue);
            this.sortArray.swap(i, largest);

            this.sortArray.clearTreeHighlight(i, "secondary");
            this.sortArray.clearTreeHighlight(largest, "secondary");
            this.sortArray.clearTreeHighlight(i, "tertiary");

            await this.heapify(n, largest);
            return;
        }

        this.sortArray.clearTreeHighlight(i, "tertiary");
    }
}
