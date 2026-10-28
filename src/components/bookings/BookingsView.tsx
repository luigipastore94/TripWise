import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import {
  Plus,
  Plane,
  Train,
  BedDouble,
  Car,
  Ticket,
  FileText,
  QrCode,
  Copy,
  Check,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  Upload,
  ExternalLink,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { Booking, BookingType } from '../../types/trip';
import { ModalDialog } from '../ui/ModalDialog';
import { buildExternalMapsUrl } from '../../services/geocoding';

const BOOKING_TYPES: Record<
  BookingType,
  { label: string; badgeClass: string; Icon: React.FC<{ className?: string }> }
> = {
  flight: {
    label: 'Volo',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    Icon: Plane
  },
  train: {
    label: 'Treno / Transfer',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    Icon: Train
  },
  lodging: {
    label: 'Alloggio / Hotel',
    badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    Icon: BedDouble
  },
  car: {
    label: 'Noleggio / Auto',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Icon: Car
  },
  activity: {
    label: 'Biglietto / Evento',
    badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    Icon: Ticket
  },
  document: {
    label: 'Documento / Pass',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    Icon: FileText
  }
};

const MAX_PDF_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0]?.replace('data:', '') || 'application/pdf';
  const base64Data = parts[1] || '';
  const raw = window.atob(base64Data);
  const uInt8Array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

function readPdfToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Errore lettura file PDF'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Formato non supportato'));
      }
    };
    reader.readAsDataURL(file);
  });
}

function compressImageToDataUrl(file: File, maxDim = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Errore lettura file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Immagine non valida'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const BookingsView: React.FC = () => {
  const { activeTrip, upsertBooking, deleteBooking } = useTrip();
  const idPrefix = useId();

  const [filterType, setFilterType] = useState<'all' | BookingType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bType, setBType] = useState<BookingType>('lodging');
  const [bTitle, setBTitle] = useState('');
  const [bProvider, setBProvider] = useState('');
  const [bCode, setBCode] = useState('');
  const [bDateTime, setBDateTime] = useState('');
  const [bLocation, setBLocation] = useState('');
  const [bQrPayload, setBQrPayload] = useState('');
  const [bQrImage, setBQrImage] = useState('');
  const [bPdfDataUrl, setBPdfDataUrl] = useState('');
  const [bPdfFileName, setBPdfFileName] = useState('');
  const [bPdfFileSize, setBPdfFileSize] = useState<number>(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bNotes, setBNotes] = useState('');

  // QR Pass Fullscreen Viewer
  const [qrViewerBooking, setQrViewerBooking] = useState<Booking | null>(null);
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');

  // PDF Ticket Fullscreen Viewer
  const [pdfViewerBooking, setPdfViewerBooking] = useState<Booking | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');

  useEffect(() => {
    if (!qrViewerBooking) {
      setGeneratedQrUrl('');
      return;
    }
    if (qrViewerBooking.qrImageDataUrl) {
      setGeneratedQrUrl(qrViewerBooking.qrImageDataUrl);
      return;
    }
    const textToEncode = qrViewerBooking.qrPayload || qrViewerBooking.confirmationCode || '';
    if (textToEncode) {
      QRCode.toDataURL(textToEncode, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then(setGeneratedQrUrl)
        .catch(() => setGeneratedQrUrl(''));
    }
  }, [qrViewerBooking]);

  useEffect(() => {
    if (!pdfViewerBooking?.pdfDataUrl) {
      setPdfBlobUrl('');
      return;
    }
    try {
      const blob = dataUrlToBlob(pdfViewerBooking.pdfDataUrl);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch {
      setPdfBlobUrl('');
    }
  }, [pdfViewerBooking]);

  if (!activeTrip) return null;

  const filteredBookings = activeTrip.bookings.filter((b) =>
    filterType === 'all' ? true : b.type === filterType
  );

  const openAddModal = () => {
    setEditingBooking(null);
    setBType('lodging');
    setBTitle('');
    setBProvider('');
    setBCode('');
    setBDateTime('');
    setBLocation('');
    setBQrPayload('');
    setBQrImage('');
    setBPdfDataUrl('');
    setBPdfFileName('');
    setBPdfFileSize(0);
    setFileError(null);
    setBNotes('');
    setModalOpen(true);
  };

  const openEditModal = (b: Booking) => {
    setEditingBooking(b);
    setBType(b.type);
    setBTitle(b.title);
    setBProvider(b.provider || '');
    setBCode(b.confirmationCode || '');
    setBDateTime(b.dateTime || '');
    setBLocation(b.locationAddress || '');
    setBQrPayload(b.qrPayload || '');
    setBQrImage(b.qrImageDataUrl || '');
    setBPdfDataUrl(b.pdfDataUrl || '');
    setBPdfFileName(b.pdfFileName || '');
    setBPdfFileSize(b.pdfFileSize || 0);
    setFileError(null);
    setBNotes(b.notes || '');
    setModalOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    // Postel's Law: Forgiving input - route images to image handler
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageToDataUrl(file);
        setBQrImage(compressed);
        if (!bTitle.trim()) {
          const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setBTitle(suggested);
        }
      } catch {
        setFileError('Impossibile elaborare l\'immagine.');
      }
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Seleziona un file in formato PDF valido (es. biglietto o ricevuta di prenotazione).');
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setFileError(
        `Il file "${file.name}" supera i 2.5 MB massimi (${formatFileSize(file.size)}). Carica una versione più compatta o fai uno screenshot delle pagine con il biglietto.`
      );
      return;
    }

    try {
      const dataUrl = await readPdfToDataUrl(file);
      setBPdfDataUrl(dataUrl);
      setBPdfFileName(file.name);
      setBPdfFileSize(file.size);
      if (!bTitle.trim()) {
        const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setBTitle(suggested);
      }
    } catch {
      setFileError('Impossibile leggere il file PDF. Riprova con un altro documento.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    // Postel's Law: If a PDF was chosen in the image slot, route to PDF handler
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > MAX_PDF_BYTES) {
        setFileError(
          `Il file "${file.name}" supera i 2.5 MB massimi (${formatFileSize(file.size)}). Carica un PDF più leggero.`
        );
        return;
      }
      try {
        const dataUrl = await readPdfToDataUrl(file);
        setBPdfDataUrl(dataUrl);
        setBPdfFileName(file.name);
        setBPdfFileSize(file.size);
        if (!bTitle.trim()) {
          const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setBTitle(suggested);
        }
      } catch {
        setFileError('Impossibile leggere il file PDF.');
      }
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file);
      setBQrImage(compressed);
      if (!bTitle.trim()) {
        const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setBTitle(suggested);
      }
    } catch {
      setFileError('Immagine non valida o formato non supportato.');
    }
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;

    const payload: Booking = {
      id: editingBooking?.id ?? `bkg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: bType,
      title: bTitle.trim(),
      provider: bProvider.trim() || undefined,
      confirmationCode: bCode.trim() || undefined,
      dateTime: bDateTime || undefined,
      locationAddress: bLocation.trim() || undefined,
      qrPayload: bQrPayload.trim() || undefined,
      qrImageDataUrl: bQrImage || undefined,
      pdfDataUrl: bPdfDataUrl || undefined,
      pdfFileName: bPdfFileName.trim() || undefined,
      pdfFileSize: bPdfFileSize || undefined,
      notes: bNotes.trim() || undefined
    };

    upsertBooking(payload);
    setModalOpen(false);
  };

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section aria-label="Prenotazioni, Biglietti e Pass QR" className="space-y-4">
      {/* Top Action + Category Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filterType === 'all'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Tutti ({activeTrip.bookings.length})
          </button>
          {(Object.keys(BOOKING_TYPES) as BookingType[]).map((t) => {
            const meta = BOOKING_TYPES[t];
            const Icon = meta.Icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-colors ${
                  filterType === t
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[48px] px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Aggiungi Prenotazione / Biglietto</span>
        </button>
      </div>

      {/* Bookings Cards Grid */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/60 dark:bg-slate-900/50">
          <FileText className="w-10 h-10 mx-auto text-brand-500 mb-2" aria-hidden="true" />
          <h3 className="text-base font-bold">Nessun documento o prenotazione in questa vista</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Salva qui biglietti PDF di treni e voli, ricevute hotel, codici PNR o screenshot di codici QR per aprirli e consultarli al volo anche offline!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const meta = BOOKING_TYPES[b.type] || BOOKING_TYPES.document;
            const TypeIcon = meta.Icon;
            const hasQr = Boolean(b.qrImageDataUrl || b.qrPayload || b.confirmationCode);
            const hasPdf = Boolean(b.pdfDataUrl);

            return (
              <article
                key={b.id}
                className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${meta.badgeClass}`}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        aria-label={`Modifica ${b.title}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBooking(b.id)}
                        aria-label={`Elimina ${b.title}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{b.title}</h3>
                    {b.provider && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {b.provider}
                      </p>
                    )}
                  </div>

                  {b.dateTime && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" aria-hidden="true" />
                      <span>
                        {new Date(b.dateTime).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {b.locationAddress && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" aria-hidden="true" />
                        <span className="truncate">{b.locationAddress}</span>
                      </span>
                      <a
                        href={buildExternalMapsUrl({ locationName: b.locationAddress })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 font-semibold inline-flex items-center gap-0.5 shrink-0 hover:underline"
                      >
                        <span>Mappa</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  )}

                  {/* Attached PDF document strip */}
                  {b.pdfDataUrl && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                          PDF
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {b.pdfFileName || 'Biglietto allegato.pdf'}
                        </span>
                        {b.pdfFileSize ? (
                          <span className="text-slate-500 dark:text-slate-400 shrink-0 text-[11px]">
                            {formatFileSize(b.pdfFileSize)}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPdfViewerBooking(b)}
                        className="shrink-0 text-red-600 dark:text-red-400 font-bold hover:underline inline-flex items-center gap-1"
                        aria-label={`Visualizza PDF ${b.title}`}
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Vedi</span>
                      </button>
                    </div>
                  )}

                  {b.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                      {b.notes}
                    </p>
                  )}
                </div>

                {/* Confirmation Code & Quick Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {b.confirmationCode ? (
                    <button
                      type="button"
                      onClick={() => copyCode(b.id, b.confirmationCode!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span>RIF: {b.confirmationCode}</span>
                      {copiedId === b.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Nessun codice PNR</span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {hasPdf && (
                      <button
                        type="button"
                        onClick={() => setPdfViewerBooking(b)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <FileText className="w-4 h-4" aria-hidden="true" />
                        <span>Apri PDF</span>
                      </button>
                    )}

                    {hasQr && (
                      <button
                        type="button"
                        onClick={() => setQrViewerBooking(b)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <QrCode className="w-4 h-4" aria-hidden="true" />
                        <span>Mostra Pass / QR</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Booking Modal */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBooking ? 'Modifica Prenotazione' : 'Nuova Prenotazione o Biglietto'}
        subtitle="I documenti PDF e i codici QR vengono salvati nella memoria locale per l'uso rapido anche senza internet"
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${idPrefix}-type`} className="block text-sm font-semibold mb-1">
                Tipologia
              </label>
              <select
                id={`${idPrefix}-type`}
                name="type"
                value={bType}
                onChange={(e) => setBType(e.target.value as BookingType)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                {Object.entries(BOOKING_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-code`} className="block text-sm font-semibold mb-1">
                Codice Prenotazione / PNR
              </label>
              <input
                id={`${idPrefix}-code`}
                name="confirmation_code"
                type="text"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={bCode}
                onChange={(e) => setBCode(e.target.value)}
                placeholder="Es. X8K92L"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-title`} className="block text-sm font-semibold mb-1">
              Titolo prenotazione / documento *
            </label>
            <input
              id={`${idPrefix}-title`}
              name="title"
              type="text"
              required
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              placeholder="Es. Frecciarossa Milano-Roma, Volo andata, Hotel Shinjuku, Ingresso Museo..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${idPrefix}-prov`} className="block text-sm font-semibold mb-1">
                Compagnia / Struttura
              </label>
              <input
                id={`${idPrefix}-prov`}
                name="provider"
                type="text"
                value={bProvider}
                onChange={(e) => setBProvider(e.target.value)}
                placeholder="Es. Trenitalia, Italo, ITA Airways, Booking.com..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-dt`} className="block text-sm font-semibold mb-1">
                Data e Ora (Partenza / Check-in)
              </label>
              <input
                id={`${idPrefix}-dt`}
                name="datetime"
                type="datetime-local"
                value={bDateTime}
                onChange={(e) => setBDateTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-addr`} className="block text-sm font-semibold mb-1">
              Indirizzo / Stazione / Terminal
            </label>
            <input
              id={`${idPrefix}-addr`}
              name="address"
              type="text"
              value={bLocation}
              onChange={(e) => setBLocation(e.target.value)}
              placeholder="Indirizzo completo per apertura rapida nella mappa"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          {/* Allegati Biglietto (PDF) & Pass QR Offline */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Biglietto PDF & Pass Offline
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Carica il biglietto PDF ufficiale (treni, voli, hotel) e/o uno screenshot del codice QR
              </div>
            </div>

            {fileError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{fileError}</span>
              </div>
            )}

            {/* 1. PDF Attachment Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Biglietto o Ricevuta in formato PDF
              </label>

              {bPdfDataUrl ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {bPdfFileName || 'Biglietto.pdf'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Documento PDF {bPdfFileSize ? `• ${formatFileSize(bPdfFileSize)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const blob = dataUrlToBlob(bPdfDataUrl);
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                    >
                      Anteprima
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBPdfDataUrl('');
                        setBPdfFileName('');
                        setBPdfFileSize(0);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor={`${idPrefix}-pdf-file`}
                    className="min-h-[46px] w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer hover:border-red-500 hover:text-red-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-500" aria-hidden="true" />
                    <span>Carica Biglietto PDF (Trenitalia, Italo, Voli, Hotel...)</span>
                  </label>
                  <input
                    id={`${idPrefix}-pdf-file`}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="visually-hidden"
                  />
                </div>
              )}
            </div>

            {/* 2. QR Code Screenshot Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Screenshot Codice QR o Pass Rapido (opzionale)
              </label>

              {bQrImage ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={bQrImage}
                      alt="Anteprima pass caricato"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain rounded-lg border bg-white p-1 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Screenshot Pass salvato
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pronto per la scansione ottica ai tornelli
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBQrImage('')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor={`${idPrefix}-qrimg`}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-brand-500" aria-hidden="true" />
                    <span>Carica screenshot immagine del QR Code</span>
                  </label>
                  <input
                    id={`${idPrefix}-qrimg`}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="visually-hidden"
                  />
                </div>
              )}
            </div>

            {/* 3. Text / URL for Vector QR generation */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <label htmlFor={`${idPrefix}-qrtext`} className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Genera QR da codice o link (opzionale)
              </label>
              <input
                id={`${idPrefix}-qrtext`}
                name="qr_payload"
                type="text"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={bQrPayload}
                onChange={(e) => setBQrPayload(e.target.value)}
                placeholder="Link voucher, codice biglietto o testo..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-notes`} className="block text-sm font-semibold mb-1">
              Note (es. carrozza e posto, binario, franchigia bagagli)
            </label>
            <textarea
              id={`${idPrefix}-notes`}
              name="notes"
              rows={2}
              value={bNotes}
              onChange={(e) => setBNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition-colors"
            >
              Salva Prenotazione
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* High-Quality Dedicated PDF Ticket & Voucher Viewer Modal */}
      <ModalDialog
        open={Boolean(pdfViewerBooking)}
        onClose={() => setPdfViewerBooking(null)}
        title={pdfViewerBooking?.title ?? 'Biglietto PDF'}
        subtitle={
          pdfViewerBooking
            ? `${pdfViewerBooking.pdfFileName || 'Biglietto.pdf'}${
                pdfViewerBooking.pdfFileSize ? ` • ${formatFileSize(pdfViewerBooking.pdfFileSize)}` : ''
              }`
            : ''
        }
        maxWidthClass="max-w-4xl"
      >
        {pdfViewerBooking && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  PDF
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-md">
                  {pdfViewerBooking.pdfFileName || 'Biglietto.pdf'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pdfBlobUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(pdfBlobUrl, '_blank')}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Schermo intero</span>
                    </button>
                    <a
                      href={pdfBlobUrl}
                      download={pdfViewerBooking.pdfFileName || 'biglietto.pdf'}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Scarica</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Embedded IFrame / Fallback View */}
            {pdfBlobUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                <iframe
                  src={pdfBlobUrl}
                  title={pdfViewerBooking.title}
                  className="w-full h-[62vh] min-h-[380px] bg-white"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Caricamento documento in corso...
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              💡 Su smartphone tocca "Schermo intero" per ingrandire codice a barre, posto e dettagli del biglietto con lo zoom nativo.
            </p>
          </div>
        )}
      </ModalDialog>

      {/* High-Contrast Fullscreen QR Pass Viewer (forced light surface for optical scanners) */}
      <ModalDialog
        open={Boolean(qrViewerBooking)}
        onClose={() => setQrViewerBooking(null)}
        title={qrViewerBooking?.title ?? 'Pass QR'}
        subtitle="Sfondo bianco ad alto contrasto ottimizzato per lettori ottici"
        maxWidthClass="max-w-sm"
      >
        {qrViewerBooking && (
          <div className="text-center space-y-4">
            <div
              style={{ colorScheme: 'light' }}
              className="rounded-2xl bg-white text-slate-900 p-5 border-2 border-slate-200 shadow-inner mx-auto flex flex-col items-center"
            >
              {generatedQrUrl ? (
                <img
                  src={generatedQrUrl}
                  alt={`QR Code per ${qrViewerBooking.title}`}
                  width={260}
                  height={260}
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <p className="text-sm text-slate-500 py-8">Generazione codice in corso...</p>
              )}

              {qrViewerBooking.confirmationCode && (
                <div className="mt-3 pt-3 border-t border-slate-200 w-full">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Codice Riferimento
                  </div>
                  <div className="text-xl font-mono font-black tracking-widest text-slate-900 mt-0.5">
                    {qrViewerBooking.confirmationCode}
                  </div>
                </div>
              )}
            </div>
            {qrViewerBooking.locationAddress && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                📍 {qrViewerBooking.locationAddress}
              </p>
            )}
          </div>
        )}
      </ModalDialog>
    </section>
  );
};
