/**
 * Pure domain utilities for bookings, tickets, and attachments in TripWise.
 * Safe for both browser and Node.js domain testing environments.
 */

/**
 * Checks whether a booking actually possesses a scannable QR code.
 * 
 * Invariant: A booking confirmation code (PNR) is NOT a QR code and must never
 * produce a synthetic or fake QR code. Many tickets (hotel bookings, train tickets,
 * car rentals, museum reservations) only have alphanumeric codes or PDF vouchers
 * and do not have an optical QR code.
 */
export function hasBookingQr(booking?: {
  qrImageDataUrl?: string;
  qrPayload?: string;
} | null): boolean {
  if (!booking) return false;
  if (typeof booking.qrImageDataUrl === 'string' && booking.qrImageDataUrl.trim().length > 0) {
    return true;
  }
  if (typeof booking.qrPayload === 'string' && booking.qrPayload.trim().length > 0) {
    return true;
  }
  return false;
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Normalizes a PDF file name to ensure a clean basename and `.pdf` extension.
 */
export function normalizePdfFileName(fileName?: string): string {
  if (!fileName || !fileName.trim()) return 'biglietto.pdf';
  const sanitized = fileName.trim().replace(/[/\\?%*:|"<>]/g, '_');
  return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
}

/**
 * Converts a Base64 Data URL to a binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0]?.replace('data:', '') || 'application/pdf';
  const base64Data = parts[1] || '';
  
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const raw = window.atob(base64Data);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  // Node.js fallback for testing
  const buffer = Buffer.from(base64Data, 'base64');
  return new Blob([buffer], { type: contentType });
}
