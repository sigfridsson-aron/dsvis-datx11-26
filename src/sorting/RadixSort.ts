import { MessagesObject } from "~/engine";
import { updateDefault } from "~/helpers";
import { Sorter } from "~/sorting";
import { BaseSorter, SortMessages } from "./BaseSorter";

export const RadixSortMessages = {
    sort: {
        countingSort: (exp: string) =>
            `Performing counting sort for exponent ${exp}`,
    },
} as const satisfies MessagesObject;

export class RadixSort extends BaseSorter implements Sorter {
    override messages: MessagesObject = updateDefault(RadixSortMessages, SortMessages);

    override async sort(): Promise<void> {
        const sortSize = this.sortArray.length();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }

        let min = Number(this.sortArray.getValue(0));
        let max = min;

        for (let i = 0; i < sortSize; i++) {
            const value = Number(this.sortArray.getValue(i));
            if (!Number.isInteger(value)) {
                throw new Error("RadixSort only supports integers.");
            }
            if (value < min) min = value;
            if (value > max) max = value;
        }

        const offset = min < 0 ? -min : 0;
        const maxShifted = max + offset;

        for (let exp = 1; Math.floor(maxShifted / exp) > 0; exp *= 10) {
            await this.countingSort(exp, offset);
        }
    }

    private async countingSort(exp: number, offset: number): Promise<void> {
        const sortSize = this.sortArray.length();
        const output: string[] = new Array(sortSize);
        const count: number[] = new Array(10).fill(0);

        for (let i = 0; i < sortSize; i++) {
            const shifted = Number(this.sortArray.getValue(i)) + offset;
            const digit = Math.floor(shifted / exp) % 10;
            count[digit]++;
        }

        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        for (let i = sortSize - 1; i >= 0; i--) {
            const value = this.sortArray.getValue(i);
            const shifted = Number(value) + offset;
            const digit = Math.floor(shifted / exp) % 10;
            output[count[digit] - 1] = String(value);
            count[digit]--;
        }

        for (let i = 0; i < sortSize; i++) {
            this.sortArray.setValue(i, Number(output[i]!));
        }

        await this.pause("sort.countingSort", exp.toString());
    }
}