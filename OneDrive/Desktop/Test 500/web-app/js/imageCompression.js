/**
 * Canvas-based image compression utility
 * Compresses images to reduce file size before upload
 */

/**
 * Core compression function
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Promise<string> - Base64 encoded compressed image
 */
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();

            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = (width * maxWidth) / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 JPEG
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.onerror = function () {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target.result;
        };

        reader.onerror = function () {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Compresses a profile picture (VERY aggressive for small file size)
 * @param file - The image file
 * @returns Promise<string> - Base64 encoded compressed image
 */
window.compressProfilePicture = function (file) {
    return compressImage(file, 200, 0.3); // 200px @ 30% quality - VERY aggressive
};

/**
 * Compresses a resource/content image
 * @param file - The image file
 * @returns Promise<string> - Base64 encoded compressed image
 */
window.compressResourceImage = function (file) {
    return compressImage(file, 1200, 0.8);
};

/**
 * Generic image compression with custom parameters
 * @param file - The image file
 * @param maxWidth - Maximum width
 * @param quality - Compression quality 0-1
 * @returns Promise<string> - Base64 encoded compressed image
 */
window.compressImageCustom = function (file, maxWidth, quality) {
    return compressImage(file, maxWidth, quality);
};
