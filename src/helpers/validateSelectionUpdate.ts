import { CreateMealSelectionRequest } from "../schema/mealSelection";

// selection.errors.ts

export type SelectionErrorReason =
    | "NOT_FOUND"
    | "NOT_PENDING"
    | "NOT_AUTHORIZED"
    | "NOT_RECIPIENT";

export interface SelectionError {
    id: number;
    reason: SelectionErrorReason;
}

export class SelectionValidationError extends Error {
    constructor(
        public readonly errors: SelectionError[]
    ) {
        super("One or more selections could not be updated");
        this.name = "SelectionValidationError";
    }
}

// selection.helper.ts

export const validateSelectionUpdates = (
    selectionRequests: CreateMealSelectionRequest[],
    requesterId: number,
    existingMap: Map<number, {
        createdFor: number | null;
        selectionStatus: string;
    }>
): SelectionError[] => {

    const errors: SelectionError[] = [];

    for (const request of selectionRequests) {

        const existing = existingMap.get(request.id!);

        if (!existing) {
            errors.push({
                id: request.id!,
                reason: "NOT_FOUND"
            });

            continue;
        }

        if (existing.selectionStatus !== "PENDING") {
            errors.push({
                id: request.id!,
                reason: "NOT_PENDING"
            });

            continue;
        }

        if (existing.createdFor !== requesterId) {
            errors.push({
                id: request.id!,
                reason: "NOT_RECIPIENT"
            });
        }
    }

    return errors;
};