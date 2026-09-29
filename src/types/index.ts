export type VehicleType = '2W' | '4W';

export type PaymentMethod = "online" | "after_service" | "cash" | "upi" | "card";
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'not_required';
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type Profile = User;

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  type: VehicleType | string;
  bodyType?: string;
  make?: string;
  model?: string;
  registrationNumber?: string;
  nickname?: string;
  color?: string;
  isManual?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation {
  id: string;
  userId: string;
  label?: 'Home' | 'Work' | 'Other' | string;
  latitude: number;
  longitude: number;
  address: string;
  buildingName: string;
  houseNumber?: string;
  landmark?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleBodyType = 'scooter' | 'bike' | 'sport_bike' | 'cruiser' | 'hatchback' | 'sedan' | 'suv' | '7_seater';

export type ServicePrices = Partial<Record<VehicleBodyType, number>>;

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: 'wash' | 'cleaning' | 'add_on' | string;
  basePrice: number;
  popular?: boolean;
  prices?: ServicePrices;
  durationMinutes?: number;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  benefits: string[];
  validityDays: number;
  popular: boolean;
  isActive: boolean;
  prices?: ServicePrices;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  vehicleId: string;
  planId: string;
  status: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled' | 'payment_failed';
  billingPeriod: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pausedAt?: string;
  pauseUntil?: string;
  snapshotPrice: number;
  snapshotVehicleType: string;
  snapshotPlanName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  address: string;
  buildingName: string;
  houseNumber?: string;
  landmark?: string;
}

export interface VehicleSnapshot {
  type: string;
  bodyType?: string;
  make?: string;
  model?: string;
  registrationNumber?: string;
}

export interface ServiceSnapshot {
  serviceId: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId?: string;
  assignedProviderId?: string;
  locationSnapshot: LocationSnapshot;
  vehicleSnapshot: VehicleSnapshot;
  services: ServiceSnapshot[];
  scheduleDate: string;
  scheduleTime: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  status: BookingStatus;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}
