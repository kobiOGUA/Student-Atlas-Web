import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image to reduce file size while maintaining quality
 * @param uri - The image URI to compress
 * @param maxWidth - Maximum width (default: 1200 for general images)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Compressed image URI
 */
export async function compressImage(
    uri: string,
    maxWidth: number = 1200,
    quality: number = 0.8
): Promise<string> {
    try {
        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth } }],
            {
                compress: quality,
                format: ImageManipulator.SaveFormat.JPEG,
            }
        );
        return manipResult.uri;
    } catch (error) {
        console.error('Image compression error:', error);
        return uri; // Return original if compression fails
    }
}

/**
 * Compresses a profile picture to a smaller size
 * @param uri - The image URI to compress
 * @returns Compressed image URI optimized for avatars
 */
export async function compressProfilePicture(uri: string): Promise<string> {
    return compressImage(uri, 400, 0.5); // Match web app: 400px @ 0.5 quality
}

/**
 * Compresses a resource/post image
 * @param uri - The image URI to compress
 * @returns Compressed image URI optimized for content
 */
export async function compressResourceImage(uri: string): Promise<string> {
    return compressImage(uri, 1200, 0.8);
}

/**
 * Converts image URI to base64 with automatic compression
 * @param uri - The image URI
 * @param maxWidth - Maximum width for compression
 * @param quality - Compression quality
 * @returns Base64 encoded string
 */
export async function imageToBase64(
    uri: string,
    maxWidth: number = 1200,
    quality: number = 0.8
): Promise<string> {
    try {
        // First compress the image
        const compressedUri = await compressImage(uri, maxWidth, quality);

        // Then convert to base64
        const response = await fetch(compressedUri);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Image to base64 conversion error:', error);
        throw error;
    }
}
