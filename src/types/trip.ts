export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'transport'
  | 'lodging'
  | 'shopping'
  | 'relax'
  | 'hidden_gem';

export interface SavedPlace {
  id: string;
  name: string;
  category: ActivityCategory;
  areaOrAddress?: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  customUrl?: string;
  notes?: string;
  visited?: boolean;
  photoUrl?: string;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  locationName: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  mapUrl?: string;
  category: ActivityCategory;
  estimatedCost?: number;
  notes?: string;
  completed: boolean;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  updatedAt?: number;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'shopping'
  | 'activity'
  | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  amountInBase: number;
  paidByMemberId: string;
  splitBetweenMemberIds: string[];
  category: ExpenseCategory;
  date: string;
  notes?: string;
  updatedAt?: number;
}

export type BookingType =
  | 'flight'
  | 'train'
  | 'lodging'
  | 'car'
  | 'activity'
  | 'document';

export interface Booking {
  id: string;
  type: BookingType;
  title: string;
  provider?: string;
  confirmationCode?: string;
  dateTime?: string;
  endDateTime?: string;
  locationAddress?: string;
  lat?: number;
  lng?: number;
  qrPayload?: string;
  qrImageDataUrl?: string;
  pdfDataUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: number;
  price?: number;
  currency?: string;
  notes?: string;
  updatedAt?: number;
}

export type ChecklistCategory =
  | 'documents'
  | 'electronics'
  | 'luggage'
  | 'health_money'
  | 'other';

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  text: string;
  completed: boolean;
  assignedToMemberId?: string;
  updatedAt?: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  uid?: string;
  photoURL?: string;
  updatedAt?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
}

export interface TripData {
  id: string;
  inviteCode: string;
  title: string;
  destination: string;
  emoji: string;
  coverImage?: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  destinationCurrency: string;
  exchangeRate: number;
  defaultCenter: [number, number];
  members: Member[];
  memberUids?: string[];
  days: ItineraryDay[];
  savedPlaces?: SavedPlace[];
  expenses: Expense[];
  bookings: Booking[];
  checklist: ChecklistItem[];
  updatedAt: number;
}

export interface DestinationPreset {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  coverImage?: string;
  description: string;
  destinationCurrency: string;
  defaultExchangeRateFromEur: number;
  defaultCenter: [number, number];
  checklistItems: Array<{
    category: ChecklistCategory;
    text: string;
  }>;
  sampleActivities?: Array<{
    time: string;
    title: string;
    locationName: string;
    lat: number;
    lng: number;
    category: ActivityCategory;
    notes?: string;
  }>;
}

export interface Settlement {
  fromMemberId: string;
  toMemberId: string;
  amountInBase: number;
}

export type AppTab = 'itinerary' | 'places' | 'expenses' | 'bookings' | 'checklist';
export type ColorSchemePreference = 'light dark' | 'light' | 'dark';
