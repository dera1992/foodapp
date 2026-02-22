export type OnboardingStep = 'info' | 'address' | 'documents' | 'plan';

export interface ShopInfoData {
  name: string;
  description: string;
  logo: File | null;
  logoPreview: string | null;
}

export interface ShopAddressData {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  locationCaptured: boolean;
}

export interface ShopDocumentsData {
  businessDocument: File | null;
  fileName: string | null;
}

export interface ShopPlanData {
  planId: string;
  planName: string;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  info: ShopInfoData;
  address: ShopAddressData;
  documents: ShopDocumentsData;
  plan: ShopPlanData;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | 'free';
  features: string[];
  recommended?: boolean;
}

