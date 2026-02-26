
export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  WARNING = 'Warning',
  NON_COMPLIANT = 'Non-Compliant',
}

export enum LaborType {
  SKILLED = 'Skilled',
  SEMI_SKILLED = 'Semi-Skilled',
  UNSKILLED = 'Unskilled',
}

export interface AttendanceRecord {
  date: string;
  present: boolean;
  hoursWorked: number;
  overtimeHours: number;
  inTime?: string;
  outTime?: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  description: string;
  location: string;
  validFrom: string;
  validTo: string;
  contractValue: number; // In INR
  status: 'Active' | 'Completed' | 'Pending';
}

export interface VerificationStatus {
  aadhaar: 'PENDING' | 'VERIFIED' | 'FAILED';
  pan: 'PENDING' | 'VERIFIED' | 'FAILED';
  police: 'PENDING' | 'VERIFIED' | 'FAILED';
  bank: 'PENDING' | 'VERIFIED' | 'FAILED';
}

export interface Worker {
  id: string;
  name: string;
  type: LaborType;
  dailyWage: number; // New Field for Payroll Calculation
  aadhaarNumber: string;
  panNumber: string;
  contractorId: string;
  workOrderId?: string; // Linked Work Order
  attendance: AttendanceRecord[]; // Last 30 days
  
  // Enhanced fields for Verification Workflow
  dob: string;
  fatherName: string;
  address: string;
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  verification: VerificationStatus;
}

export interface Contractor {
  id: string;
  name: string;
  licenseNumber: string;
  contractStartDate: string; 
  licenseExpiryDate: string;
  email: string;
  phone: string;
  location: string; 
  specialization: string;
  workOrders: WorkOrder[]; // List of Work Orders
  workers: Worker[];
  status: ComplianceStatus;
}

export interface AIReport {
  id: string;
  generatedAt: string;
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: Array<{ title: string; uri: string }>;
}

// Identity Verification Types
export type VerificationType = 'AADHAAR' | 'PAN' | 'BANK' | 'GST' | 'EPF' | 'POLICE';

export interface VerificationResult {
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  transactionId: string;
  timestamp: string;
  data?: any;
  message?: string;
}

// Graph Generation Types
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  description?: string;
  data: Record<string, any>[];
  xAxisKey: string; // Key for X Axis (e.g., 'name', 'date')
  dataKeys: Array<{
    key: string;
    color: string;
    name?: string;
  }>;
}

// Reconciliation Types
export type ReconStatus = 'MATCH' | 'MISMATCH' | 'NOT_FOUND_IN_DB' | 'NOT_FOUND_IN_CHALLAN';

export interface ReconciliationRecord {
  id: string;
  uan: string;
  employeeName: string;
  category: 'System' | 'Challan';
  
  // Calculation Data
  daysPresent: number;
  calculatedWage: number;
  calculatedPF: number; // System calculation
  
  // Challan Data
  challanWage: number;
  challanPF: number; // From File
  
  // Comparison
  difference: number;
  status: ReconStatus;
  remarks?: string;
}

export interface ReconciliationSummary {
  totalRecords: number;
  matchedCount: number;
  mismatchCount: number;
  notFoundInDbCount: number;
  notFoundInChallanCount: number;
  totalCalculatedPF: number;
  totalChallanPF: number;
  netDifference: number;
}
