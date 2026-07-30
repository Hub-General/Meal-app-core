import z from "zod";

export const DislikesRequestSchema = z.object({
    foods: z.array(z.string()).optional(),
    meals: z.array(z.number()).optional(),
}).refine(data => (data.foods?.length ?? 0) + (data.meals?.length ?? 0) > 0, {
    message: "At least one food code or meal ID must be provided",
});

export type DislikesRequest = z.infer<typeof DislikesRequestSchema>;
