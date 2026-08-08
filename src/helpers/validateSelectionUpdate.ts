import { CreateMealSelectionRequest, MealSelection } from "../schema/mealSelection";

// selection.errors.ts

export type SelectionErrorReason =
    | "NOT_FOUND"
    | "NOT_PENDING"
    | "NOT_AUTHORIZED";

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
    existingMap: Map<number, Partial<MealSelection>>
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

        const isCreatedForOwner =
            existing.createdForUser?.id === requesterId;

        const isCreatedByOwner =
            existing.createdByUser?.id === requesterId;

        if (!isCreatedForOwner && !isCreatedByOwner) {
            errors.push({
                id: request.id!,
                reason: "NOT_AUTHORIZED"
            });
        }
    }

    return errors;
};