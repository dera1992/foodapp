export type DispatcherStep = 'personal' | 'vehicle' | 'success';

export type VehicleType = 'bicycle' | 'motorbike' | 'car' | 'van';

export interface PersonalData {
  fullName: string;
  phone: string;
  idNumber: string;
  dob: string;
  idDocument: File | null;
  idFileName: string | null;
}

export interface VehicleData {
  vehicleType: VehicleType;
  plateNumber: string;
  vehicleModel: string;
  vehicleDocument: File | null;
  vehicleFileName: string | null;
}

export interface VehicleOption {
  id: VehicleType;
  emoji: string;
  label: string;
}

