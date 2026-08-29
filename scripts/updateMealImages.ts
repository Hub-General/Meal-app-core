import fs from "fs";
import path from "path";
import crypto from "crypto";
import "dotenv/config";
import prisma from "../src/prisma/client";
import { uploadFile, getPublicUrl } from "../src/config/supabaseStorage";

interface MealImageData {
    id: number;
    name: string;
    foodCode: string;
    imageUrl: string;
}

const USER_AGENT = "MealAppUpdater/1.0 (https://mealapp.com; contact@mealapp.com) node-fetch/3.0";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Downloads an image buffer from an online URL with exponential backoff for rate limiting.
 */
async function fetchImageBuffer(
    urlOrPath: string,
    retries = 5
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    // Check if it's a local file first
    let localPath = urlOrPath;
    if (!path.isAbsolute(localPath)) {
        const cwdPath = path.resolve(process.cwd(), urlOrPath);
        const dirnamePath = path.resolve(__dirname, urlOrPath);
        const rootPath = path.resolve(__dirname, '..', urlOrPath);

        if (fs.existsSync(cwdPath)) localPath = cwdPath;
        else if (fs.existsSync(dirnamePath)) localPath = dirnamePath;
        else if (fs.existsSync(rootPath)) localPath = rootPath;
    }

    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        const buffer = fs.readFileSync(localPath);
        let extension = path.extname(localPath).replace('.', '').toLowerCase() || 'jpg';
        let contentType = 'image/jpeg';
        if (extension === 'png') contentType = 'image/png';
        else if (extension === 'webp') contentType = 'image/webp';
        else if (extension === 'gif') contentType = 'image/gif';
        return { buffer, contentType, extension };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(urlOrPath, {
                headers: {
                    "User-Agent": USER_AGENT,
                    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                },
            });

            if (response.status === 429) {
                const waitMs = attempt * 2000;
                console.warn(`[Rate Limited 429] Waiting ${waitMs}ms before retrying ${urlOrPath}...`);
                await sleep(waitMs);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get("content-type") || "image/jpeg";

            let extension = "jpg";
            if (contentType.includes("png")) extension = "png";
            else if (contentType.includes("webp")) extension = "webp";
            else if (contentType.includes("gif")) extension = "gif";
            else if (contentType.includes("jpeg")) extension = "jpg";

            return { buffer, contentType, extension };
        } catch (error: any) {
            if (attempt === retries) throw error;
            await sleep(attempt * 1000);
        }
    }
    throw new Error(`Failed to download image after ${retries} attempts from ${urlOrPath}`);
}

/**
 * Updates meal using Backend API endpoint (PUT /meals/:id) with JWT Bearer Token.
 */
async function updateMealViaApi(
    apiUrl: string,
    token: string,
    meal: MealImageData,
    imageBuffer: Buffer,
    contentType: string,
    extension: string
): Promise<string> {
    const formData = new FormData();
    formData.append("name", meal.name);
    formData.append("foodCode", meal.foodCode);

    const blob = new Blob([new Uint8Array(imageBuffer)], { type: contentType });
    formData.append("image", blob, `${meal.name.replace(/\s+/g, "_")}.${extension}`);

    const url = `${apiUrl.replace(/\/$/, "")}/meals/${meal.id}`;
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API returned ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    return data?.meal?.imagePath || "Updated";
}

/**
 * Updates meal directly using Supabase Storage and Prisma Database client.
 */
async function updateMealDirect(
    meal: MealImageData,
    imageBuffer: Buffer,
    contentType: string,
    extension: string
): Promise<string> {
    const filename = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `meals/${filename}`;

    await uploadFile(storagePath, imageBuffer, contentType);
    const publicUrl = getPublicUrl(storagePath);

    await prisma.meals.update({
        where: { id: meal.id },
        data: {
            imagePath: publicUrl,
            name: meal.name,
            foodCode: meal.foodCode,
        },
    });

    return publicUrl;
}

async function main() {
    const args = process.argv.slice(2);
    let token: string = process.env.TOKEN || "";
    let apiUrl: string = process.env.API_URL || "http://localhost:5000";
    let isDirect = true;
    let force = args.includes("--force");
    let dryRun = args.includes("--dry-run");

    // Parse token from arguments if provided
    for (const arg of args) {
        if (arg.startsWith("--token=")) {
            token = arg.split("=")[1] ?? "";
            isDirect = false;
        } else if (arg.startsWith("--api-url=")) {
            apiUrl = arg.split("=")[1] ?? "http://localhost:5000";
        } else if (!arg.startsWith("--") && !token) {
            token = arg;
            isDirect = false;
        }
    }

    if (args.includes("--direct")) {
        isDirect = true;
    }

    const dataFilePath = path.join(__dirname, "meal_images_data.json");
    if (!fs.existsSync(dataFilePath)) {
        console.error(`Error: Data file not found at ${dataFilePath}`);
        process.exit(1);
    }

    const meals: MealImageData[] = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
    console.log(`\n🍽️ Meal Image Updater`);
    console.log(`==========================================`);
    console.log(`Total Meals to Process: ${meals.length}`);
    console.log(`Mode: ${isDirect ? "Direct (Prisma + Supabase Storage)" : `API (${apiUrl} with Bearer Token)`}`);
    if (dryRun) console.log(`Dry Run: Enabled (no DB or Storage updates)`);
    if (force) console.log(`Force Overwrite: Enabled`);
    console.log(`==========================================\n`);

    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        if (!meal) continue;
        const progress = `[${i + 1}/${meals.length}] (ID: ${meal.id}) ${meal.name}`;

        try {
            // If the image is already in Supabase Storage and we are not forcing overwrite
            if (meal.imageUrl.includes("supabase.co/storage") && !force) {
                console.log(`⏭️  ${progress}: Already has Supabase image (${meal.imageUrl.split("/").pop()})`);
                if (isDirect && !dryRun) {
                    await prisma.meals.update({
                        where: { id: meal.id },
                        data: { imagePath: meal.imageUrl },
                    });
                }
                skippedCount++;
                continue;
            }

            console.log(`⬇️  ${progress}: Downloading from online source...`);
            const { buffer, contentType, extension } = await fetchImageBuffer(meal.imageUrl);

            if (dryRun) {
                console.log(`🔍 ${progress}: Downloaded ${buffer.length} bytes (${contentType}) [Dry run - verified OK]`);
                successCount++;
                continue;
            }

            let resultUrl = "";
            if (isDirect) {
                console.log(`☁️  ${progress}: Uploading to Supabase Storage & updating DB...`);
                resultUrl = await updateMealDirect(meal, buffer, contentType, extension);
            } else {
                console.log(`🚀 ${progress}: Sending to API ${apiUrl}/meals/${meal.id}...`);
                resultUrl = await updateMealViaApi(apiUrl, token, meal, buffer, contentType, extension);
            }

            console.log(`✅ ${progress}: Updated successfully!`);
            console.log(`   URL: ${resultUrl}\n`);
            successCount++;

            // Polite delay between requests to avoid rate limits
            await sleep(600);
        } catch (error: any) {
            console.error(`❌ ${progress}: FAILED - ${error.message}\n`);
            failCount++;
        }
    }

    console.log(`\n==========================================`);
    console.log(`🎉 Finished Processing!`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped:    ${skippedCount}`);
    console.log(`   ❌ Failed:     ${failCount}`);
    console.log(`==========================================\n`);

    if (isDirect) {
        await prisma.$disconnect();
    }
}

main().catch(async (error) => {
    console.error("Fatal Error:", error);
    await prisma.$disconnect();
    process.exit(1);
});
