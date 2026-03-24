import { MessagesObject, NBSP } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { Sorter } from "~/sorting";
import { BaseSorter, SortMessages } from "./BaseSorter";

export const HeapSortMessages = {
    sort: {
        swap: (a: string, b: string) => `Swapping ${a} and ${b}`,
    },
} as const satisfies MessagesObject;

export class HeapSort extends BaseSorter implements Sorter {
    messages: MessagesObject = updateDefault(HeapSortMessages, SortMessages);
    async sort() {
        let sortSize = this.sortArray.length();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }
        // Build a maxheap
        for (let i = Math.floor(sortSize / 2) - 1; i >= 0; i--) {
            await this.heapify(sortSize, i);
        }
        // One by one extract elements from heap
        for (let i = sortSize - 1; i > 0; i--) {
            // Move current root to end
            this.sortArray.swap(0, i);
            // Message: Swapping the root with the last element
            await this.pause(
                "sort.swap",
                this.sortArray.getValue(0),
                this.sortArray.getValue(i)
            );
            // Call heapify on the reduced heap
            await this.heapify(i, 0);
        }
    }

    private async heapify(n: number, i: number) {
        let largest = i; // Initialize largest as root
        let left = 2 * i + 1; // left = 2*i + 1
        let right = 2 * i + 2; // right = 2*i + 2

        // If left child is larger than root
        if (
            left < n &&
            Number(this.sortArray.getValue(left)) >
                Number(this.sortArray.getValue(largest))
        ) {
            largest = left;
        }

        // If right child is larger than largest so far
        if (
            right < n &&
            Number(this.sortArray.getValue(right)) >
                Number(this.sortArray.getValue(largest))
        ) {
            largest = right;
        }

        // If largest is not root
        if (largest !== i) {
            this.sortArray.swap(i, largest);
            // Message: Swapping the current node with the largest child
            await this.pause(
                "sort.swap",
                this.sortArray.getValue(i),
                this.sortArray.getValue(largest)
            );
            // Recursively heapify the affected sub-tree
            await this.heapify(n, largest);
        }
    }
}
