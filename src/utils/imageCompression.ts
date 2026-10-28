/**
 * Compresses an image file client-side into a lightweight JPEG data URL.
 * Adheres to Tesler's Law (absorbs compression complexity in the logic layer)
 * and Doherty Threshold (fast canvas resize under 150ms).
 */
export function compressImageToDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Il file selezionato non è un\'immagine valida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file immagine selezionato.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Impossibile decodificare l\'immagine.'));
      img.onload = () => {
        const longestSide = Math.max(img.width, img.height);
        const scale = longestSide > maxDim ? maxDim / longestSide : 1;
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Standardized lightweight JPEG format suitable for offline caching & cloud sync
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
