export interface Meal {
    id: number;
    name: string;
    image: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    foodCode: string;
    calories: number;
    description?: string;
}

export interface CreateMealRequest {
    name: string;
    image?: string;
    isActive?: boolean;
    foodCode: string;
    calories: number;
    description?: string;
}