export interface Menu {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
}

export interface CreateMenuRequest {
    title: string;
    description?: string;
    isActive?: boolean;
}