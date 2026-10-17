export const tastePersonalities = {
    BALANCED: {
        name: "Balanced",
        description: "Chooses a steady mix of familiar and varied meals without leaning too heavily into one pattern.",
    },
    EXPLORER: {
        name: "Explorer",
        description: "Frequently rotates meals and shows a strong preference for variety across the year.",
    },
    LOYALIST: {
        name: "Loyalist",
        description: "Faithfully returns to a core rotation of favourite meals and keeps selection habits highly consistent.",
    },
    COMFORT_SEEKER: {
        name: "Comfort Seeker",
        description: "Leans toward familiar, satisfying meals with a moderate preference for repeat selections.",
    },
    PROTEIN_LOVER: {
        name: "Protein Lover",
        description: "Shows a strong preference for protein-forward meals compared with other selection patterns.",
    },
    HEALTH_CONSCIOUS: {
        name: "Health Conscious",
        description: "Frequently chooses fresh salads, lighter meal options, and mindful calorie choices.",
    },
    SPICE_CHASER: {
        name: "Spice Chaser",
        description: "Often chooses meals with bold or spicy preparation patterns.",
    },
    HEAVY_EATER: {
        name: "Heavy Eater",
        description: "Frequently chooses hearty, traditional swallow-based meals.",
    },
    ADVENTUROUS: {
        name: "Adventurous",
        description: "Combines high variety with bolder preparation choices and a willingness to move around the menu.",
    },
} as const;

export type TastePersonality = keyof typeof tastePersonalities;
