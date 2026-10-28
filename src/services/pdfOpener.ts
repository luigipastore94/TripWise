import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { dataUrlToBlob, normalizePdfFileName } from '../utils/bookingUtils';

export interface OpenPdfResult {
  success: boolean;
  method: 'capacitor' | 'web-share' | 'download' | 'tab' | 'error';
  message?: string;
}

/**
 * Detects whether the current environment is a smartphone or tablet.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const userAgent = navigator.userAgent || '';
  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      userAgent
    );
  return isMobileUa || (isTouchDevice && window.innerWidth < 1024);
}

/**
 * Checks whether the Web Share API with File sharing is supported in the current browser.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Proposes to open the PDF ticket using an external mobile application
 * (e.g., Google Drive PDF Viewer, Adobe Acrobat, Files, Samsung Notes, etc.)
 * across Capacitor Android/iOS, Web/PWA, and desktop browsers.
 */
export async function openPdfWithExternalApp(options: {
  pdfDataUrl?: string;
  blob?: Blob;
  fileName?: string;
}): Promise<OpenPdfResult> {
  const fileName = normalizePdfFileName(options.fileName);
  let blob = options.blob;
  let dataUrl = options.pdfDataUrl;

  if (!blob && dataUrl) {
    try {
      blob = dataUrlToBlob(dataUrl);
    } catch (err) {
      console.warn('Failed to convert dataUrl to blob:', err);
    }
  }

  // 1. Native Capacitor App (Android APK / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      let base64Data = '';
      if (dataUrl && dataUrl.includes(';base64,')) {
        base64Data = dataUrl.split(';base64,')[1];
      } else if (blob) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = (reader.result as string) || '';
            resolve(res.includes(';base64,') ? res.split(';base64,')[1] : res);
          };
          reader.onerror = () => reject(new Error('Errore lettura blob'));
          reader.readAsDataURL(blob!);
        });
      }

      if (base64Data) {
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title: fileName,
          text: `Biglietto: ${fileName}`,
          url: writeResult.uri,
          dialogTitle: 'Apri biglietto con un\'app'
        });

        return { success: true, method: 'capacitor' };
      }
    } catch (err) {
      console.warn('Capacitor native open/share failed, falling back to Web APIs:', err);
    }
  }

  // 2. Web Share API with Files (Chrome Android, Safari iOS, installed PWA)
  if (blob && canShareFiles()) {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      await navigator.share({
        title: fileName,
        files: [file]
      });
      return { success: true, method: 'web-share' };
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === 'AbortError' ||
          err.message.includes('abort') ||
          err.message.includes('canceled'))
      ) {
        return { success: true, method: 'web-share' };
      }
      console.warn('Web Share with files failed, attempting fallback:', err);
    }
  }

  // 3. Fallback: Direct Download or Browser Tab
  if (blob) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return {
        success: true,
        method: 'download',
        message: 'Biglietto scaricato sul dispositivo. Aprilo dal menu notifiche o dalla cartella Download.'
      };
    } catch (err) {
      console.warn('Direct download failed:', err);
    }
  }

  if (dataUrl) {
    try {
      window.open(dataUrl, '_blank');
      return { success: true, method: 'tab' };
    } catch {
      // ignore
    }
  }

  return {
    success: false,
    method: 'error',
    message: 'Impossibile aprire il file con un\'app esterna sul dispositivo.'
  };
}
