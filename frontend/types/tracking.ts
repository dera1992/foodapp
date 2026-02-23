export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type StepDef = {
  icon: string;
  label: string;
  timestamp: string | null;
  state: 'done' | 'active' | 'pending';
};

export type OrderItem = {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  price: number;
};

export type Dispatcher = {
  name: string;
  emoji: string;
  rating: number;
  phone: string;
};

export type TrackingResult = {
  referenceCode: string;
  status: OrderStatus;
  estimatedArrival: string | null;
  orderDate: string;
  total: number;
  deliveryAddress: string;
  etaMinutes: number | null;
  items: OrderItem[];
  dispatcher: Dispatcher | null;
  steps: StepDef[];
};

export type TrackingState = {
  query: string;
  result: TrackingResult | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
};

