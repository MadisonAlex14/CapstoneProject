import { supabase } from "./createClient.ts";

/**
 * Generates a signed URL for an image in Supabase Storage
 * @param imagePath - The path to the image within the bucket (e.g., "cards/visa-platinum.jpg")
 * @param bucketName - The name of the storage bucket (e.g., "CreditCardImage")
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL string or null if generation fails
 */
export async function getSignedImageUrl(
  imagePath: string,
  bucketName: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(imagePath, expiresIn);

    if (error) {
      console.error(`Failed to generate signed URL for ${imagePath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error(`Error generating signed URL for ${imagePath}:`, err);
    return null;
  }
}

/**
 * Generates signed URLs for multiple images
 * @param imagePaths - Array of paths to images within the bucket
 * @param bucketName - The name of the storage bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Map of image paths to their signed URLs (null for failed generations)
 */
export async function getSignedImageUrls(
  imagePaths: string[],
  bucketName: string,
  expiresIn: number = 3600
): Promise<Record<string, string | null>> {
  const signedUrls: Record<string, string | null> = {};

  const results = await Promise.all(
    imagePaths.map((imagePath) =>
      getSignedImageUrl(imagePath, bucketName, expiresIn)
    )
  );

  imagePaths.forEach((imagePath, index) => {
    signedUrls[imagePath] = results[index];
  });

  return signedUrls;
}

/**
 * Generates signed URL for an object, falling back to original path if signing fails
 * Useful for ensuring a URL is always returned
 * @param imagePath - The path to the image within the bucket
 * @param bucketName - The name of the storage bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL string or original path as fallback
 */
export async function getSignedImageUrlOrFallback(
  imagePath: string,
  bucketName: string,
  expiresIn: number = 3600
): Promise<string> {
  const signedUrl = await getSignedImageUrl(imagePath, bucketName, expiresIn);
  return signedUrl || imagePath;
}
