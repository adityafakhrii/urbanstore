export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION_PX = 1400;
const WEBP_QUALITY = 0.82;

export interface CompressedImageResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Format gambar tidak dapat dibaca oleh browser.'));
    };
    img.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengonversi gambar ke WebP.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Validates any image format up to 5MB, scales down oversized dimensions,
 * and compresses it into WebP format before uploading to Supabase Storage.
 */
export async function compressImageToWebp(file: File): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, WebP, GIF, AVIF, dll).');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }

  const originalBytes = file.size;
  const img = await loadImageElement(file);

  const srcWidth = img.naturalWidth || img.width || 1200;
  const srcHeight = img.naturalHeight || img.height || 1600;
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(srcWidth, srcHeight));

  const targetWidth = Math.max(1, Math.round(srcWidth * scale));
  const targetHeight = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas tidak tersedia di browser ini.');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let webpBlob = await canvasToWebpBlob(canvas, WEBP_QUALITY);
  // Extra pass if file is still relatively heavy (> 600 KB)
  if (webpBlob.size > 600 * 1024) {
    webpBlob = await canvasToWebpBlob(canvas, 0.7);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'product';
  const webpFile = new File([webpBlob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });

  return {
    file: webpFile,
    originalBytes,
    compressedBytes: webpFile.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
