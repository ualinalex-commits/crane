export type UserRole =
  | 'Appointed_Person'
  | 'Crane_Supervisor'
  | 'Crane_Operator'
  | 'Slinger_Signaller'
  | 'Subcontractor';

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Site {
  id: string;
  name: string;
  location: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteIds: string[];
  companyId?: string; // Subcontractor only
  active: boolean;
}

export interface Company {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  active: boolean;
}

export interface Crane {
  id: string;
  siteId: string;
  name: string;
  model: string;
  maxCapacityTonnes: number;
  active: boolean;
  colour: string; // hex — for timeline lane
}

export interface Booking {
  id: string;
  siteId: string;
  craneId: string;
  companyId: string;
  requestedById: string;
  jobDetails: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: BookingStatus;
  rejectionReason?: string;
  createdAt: string; // ISO timestamp
  approvedAt?: string;
  approvedById?: string;
}

export interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: string;
}

export type CraneLogStatus =
  | 'working'
  | 'breaking_down'
  | 'service'
  | 'thorough_examination'
  | 'wind_off';

export interface CraneLog {
  id: string;
  siteId: string;
  craneId: string;
  companyId?: string;  // only when status is 'working'
  status: CraneLogStatus;
  jobDetails: string;
  imageUri?: string;
  startTime: string;   // ISO timestamp — recorded on submit
  endTime?: string;    // ISO timestamp — recorded on close
  isOpen: boolean;
  createdById: string;
  createdAt: string;   // ISO timestamp
}
