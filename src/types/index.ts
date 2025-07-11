// Tipos principales para la aplicación de inspección vehicular

export interface VehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  ownerName: string;
  ownerPhone: string;
  bodyType?: string;
}

export interface VehicleHistory {
  simitFines: string;
  pignoracion: 'Si' | 'No';
  timbreValue: string;
  governorTax: {
    status: 'AL DIA' | 'DEBE';
    amount?: string;
  };
  mobilityTax: {
    status: 'AL DIA' | 'DEBE';
    amount?: string;
  };
  soatExpiry: {
    month: string;
    year: string;
  };
  technicalExpiry: {
    applies: 'Si' | 'No';
    month: string;
    year: string;
  };
  engineDisplacement: string;
  fuelType: 'Gasolina' | 'Diesel' | 'Hibrido' | 'Otro';
  otherFuelType?: string;
  mileage: string;
  registrationCity: string;
  fasecoldaReports: 'Con Reportes' | 'Sin reportes';
}

export interface InspectionItem {
  id: string;
  category: string;
  item: string;
  status: 'good' | 'bad' | 'needs_attention' | 'not_applicable';
  notes?: string;
  photos?: string[];
}

export interface BodyInspectionPoint {
  x: number;
  y: number;
  label: string;
  number: number;
  observation?: string;
}

export interface BodyInspection {
  points: BodyInspectionPoint[];
  vehicleType: string;
  capturedImage?: string;
}

export interface InspectionForm {
  id: string;
  vehicleInfo: VehicleInfo;
  vehicleHistory?: VehicleHistory;
  inspectionDate: Date;
  inspectorName: string;
  items: InspectionItem[];
  generalNotes?: string;
  overallStatus: 'approved' | 'rejected' | 'conditional' | 'pending';
  notes?: string;
  photos?: PhotoData[];
  bodyInspection?: BodyInspection;
}

export interface PhotoData {
  id: string;
  uri: string;
  description: string;
  timestamp: Date;
  itemId?: string; // ID del item de inspección al que pertenece
}

export interface AppSettings {
  companyName: string;
  inspectorName: string;
  defaultNotes: string[];
  autoSave: boolean;
  photoQuality: 'low' | 'medium' | 'high';
  companyLogo?: string;
  watermarkLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  reportTemplate?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  items: InspectionItem[];
  isDefault: boolean;
} 