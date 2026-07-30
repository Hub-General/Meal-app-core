const SUPABASE_PROJECT_URL = "https://rqjzrmhpyhuzbgcxeuhc.supabase.co";
const BUCKET = process.env.SUPABASE_BUCKET ?? "MealAppImages";

function getServiceRoleKey(): string {
    const key = process.env.SUPABASE_SR_KEY;
    if (!key) {
        throw new Error("Missing SUPABASE_SR_KEY environment variable");
    }
    return key;
}

/**
 * Derives the public URL for a file in the bucket.
 * Pattern: {projectUrl}/storage/v1/object/public/{bucket}/{path}
 */
export function getPublicUrl(path: string): string {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Uploads a file to Supabase Storage via the REST API.
 * POST /storage/v1/object/{bucket}/{path}
 * Returns the storage path on success.
 */
export async function uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    const url = `${SUPABASE_PROJECT_URL}/storage/v1/object/${BUCKET}/${path}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getServiceRoleKey()}`,
            "Content-Type": contentType,
            "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Supabase Storage upload failed (${response.status}): ${errorBody}`);
    }

    return path;
}

/**
 * Deletes a file from Supabase Storage via the REST API.
 * DELETE /storage/v1/object/{bucket}  with body { prefixes: [path] }
 */
export async function deleteFile(path: string): Promise<void> {
    const url = `${SUPABASE_PROJECT_URL}/storage/v1/object/${BUCKET}`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getServiceRoleKey()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [path] }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Supabase Storage delete failed (${response.status}): ${errorBody}`);
    }
}
