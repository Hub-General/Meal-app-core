export interface TastProfile {
    userId: number;
    calendarYear: number;
    totalMealsSelected: number;
    metrics: object;
    personalityType?: string;
    updatedAt: Date;
}