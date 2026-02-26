
import { Contractor, ComplianceStatus, LaborType, Worker, AttendanceRecord, WorkOrder } from './types';

// Helper to generate random attendance
const generateAttendance = (days: number): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isPresent = Math.random() > 0.1; // 90% attendance rate
    
    let inTime: string | undefined = undefined;
    let outTime: string | undefined = undefined;

    if (isPresent) {
        // Random in time between 08:00 and 10:00
        const inHour = 8 + Math.floor(Math.random() * 2); // 8 or 9
        const inMinute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        inTime = `${inHour.toString().padStart(2, '0')}:${inMinute} AM`;

        // Random out time between 17:00 (5 PM) and 20:00 (8 PM)
        const outHour = 17 + Math.floor(Math.random() * 3); // 17, 18, 19
        const outMinute = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        outTime = `${outHour.toString().padStart(2, '0')}:${outMinute} PM`;
    }

    records.push({
      date: date.toISOString().split('T')[0],
      present: isPresent,
      hoursWorked: isPresent ? 8 : 0,
      overtimeHours: isPresent && Math.random() > 0.8 ? 2 : 0,
      inTime: inTime,
      outTime: outTime
    });
  }
  return records.reverse();
};

// Helper to generate random Aadhaar Number (12 digits)
const generateAadhaar = (): string => {
  return Math.floor(200000000000 + Math.random() * 700000000000).toString();
};

// Helper to generate random PAN Number (5 chars, 4 digits, 1 char)
const generatePAN = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let pan = "";
  for (let i = 0; i < 5; i++) pan += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) pan += nums.charAt(Math.floor(Math.random() * nums.length));
  pan += chars.charAt(Math.floor(Math.random() * chars.length));
  return pan;
};

// Helper to generate Work Orders
const generateWorkOrders = (contractorId: string, count: number): WorkOrder[] => {
  const workOrders: WorkOrder[] = [];
  const tasks = ["Maintenance", "Civil Works", "Electrical Wiring", "Plumbing Overhaul", "Security Detail", "Housekeeping"];
  const locations = ["Block A", "Block B", "Utility Building", "Main Gate", "Cafeteria", "R&D Center"];

  for (let i = 0; i < count; i++) {
    workOrders.push({
      id: `wo-${contractorId}-${i}`,
      workOrderNumber: `WO-${new Date().getFullYear()}-${contractorId.toUpperCase()}-${100 + i}`,
      description: `${tasks[Math.floor(Math.random() * tasks.length)]} - ${locations[Math.floor(Math.random() * locations.length)]}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      validFrom: "2024-01-01",
      validTo: "2024-12-31",
      contractValue: Math.floor(Math.random() * 5000000) + 500000, // 5L to 55L
      status: 'Active'
    });
  }
  return workOrders;
};

// Helper to generate workers and assign to work orders
const generateWorkers = (contractorId: string, count: number, workOrders: WorkOrder[]): Worker[] => {
  const workers: Worker[] = [];
  const types = [LaborType.SKILLED, LaborType.SEMI_SKILLED, LaborType.UNSKILLED];
  
  // South Indian Names
  const names = [
    "Muthuvel Pandian", "Anbu Selvan", "Karthik Subbaraj", "Lakshmi Menon", "Siva Kumar", 
    "Meenakshi Sundaram", "Priya Anand", "Saravanan Siva", "Divya Krishnan", "Rajeshwari Iyer", 
    "Venkatesh Prabhu", "Ganesh Ram", "Subramaniam Swamy", "Kavitha Reddy", "Bala Murali",
    "Deepak Nambiar", "Senthil Kumar", "Ramesh Babu", "Jayalalithaa R", "Karunanidhi M",
    "Vijay Sethupathi", "Nayanthara K", "Surya Sivakumar", "Trisha Krishnan", "Dhanush K",
    "Kamal Haasan", "Rajinikanth", "Madhavan R", "Vikram Kennedy", "Samantha Ruth"
  ];
  
  const fathers = ["Raman", "Krishnan", "Murugan", "Velu", "Swamy", "Narayanan", "Gopal"];
  const cities = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli"];

  for (let i = 0; i < count; i++) {
    // Assign to a random work order from the contractor's list
    const assignedWO = workOrders.length > 0 ? workOrders[Math.floor(Math.random() * workOrders.length)] : undefined;
    const firstName = names[Math.floor(Math.random() * names.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Assign Daily Wage based on Type
    let wage = 0;
    if (type === LaborType.SKILLED) wage = 950;
    else if (type === LaborType.SEMI_SKILLED) wage = 750;
    else wage = 500;

    workers.push({
      id: `w-${contractorId}-${i}`,
      name: firstName,
      type: type,
      dailyWage: wage,
      contractorId: contractorId,
      workOrderId: assignedWO?.id,
      aadhaarNumber: generateAadhaar(),
      panNumber: generatePAN(),
      attendance: generateAttendance(30),
      // Detailed Personal Info
      dob: `${1980 + Math.floor(Math.random() * 20)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      fatherName: `${fathers[Math.floor(Math.random() * fathers.length)]} ${firstName.split(' ')[1] || ''}`,
      address: `No. ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 10)}th Cross St, ${cities[Math.floor(Math.random() * cities.length)]}, Tamil Nadu - 600${Math.floor(100 + Math.random() * 99)}`,
      bankDetails: {
        accountNumber: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        ifsc: `HDFC000${Math.floor(1000 + Math.random() * 9000)}`,
        bankName: "HDFC Bank"
      },
      verification: {
        aadhaar: 'PENDING',
        pan: 'PENDING',
        police: 'PENDING',
        bank: 'PENDING'
      }
    });
  }
  return workers;
};

const createMockData = (): Contractor[] => {
  const contractorsData: Partial<Contractor>[] = [
    {
      id: 'c1',
      name: "Apex Construction Services",
      licenseNumber: "LIC-2023-8892",
      contractStartDate: "2023-01-15",
      licenseExpiryDate: "2025-11-15",
      email: "contact@apexconst.com",
      phone: "+91 98765 43210",
      location: "Site A - Tech Park Phase 1",
      specialization: "Civil Works",
      status: ComplianceStatus.COMPLIANT,
    },
    {
      id: 'c2',
      name: "Rapid Workforce Solutions",
      licenseNumber: "LIC-2022-1120",
      contractStartDate: "2022-11-01",
      licenseExpiryDate: "2023-10-30", 
      email: "admin@rapidwork.net",
      phone: "+91 98989 12345",
      location: "Site B - Manufacturing Unit",
      specialization: "Electrical & HVAC",
      status: ComplianceStatus.WARNING,
    },
    {
      id: 'c3',
      name: "Global Manpower Ltd",
      licenseNumber: "LIC-2024-3321",
      contractStartDate: "2024-01-10",
      licenseExpiryDate: "2026-05-20",
      email: "hr@globalmanpower.org",
      phone: "+91 99440 55555",
      location: "Site C - Warehouse Complex",
      specialization: "General Labor",
      status: ComplianceStatus.COMPLIANT,
    },
    {
      id: 'c4',
      name: "Urban Builders Group",
      licenseNumber: "LIC-2021-5543",
      contractStartDate: "2021-12-01",
      licenseExpiryDate: "2023-12-01",
      email: "support@urbanbuilders.com",
      phone: "+91 88888 22222",
      location: "Site A - Tech Park Phase 2",
      specialization: "Masonry",
      status: ComplianceStatus.NON_COMPLIANT,
    }
  ];

  return contractorsData.map(c => {
    // 1. Generate Work Orders for this contractor
    const workOrders = generateWorkOrders(c.id!, Math.floor(Math.random() * 3) + 1);
    
    // 2. Generate Workers and assign them to these Work Orders
    const workers = generateWorkers(c.id!, Math.floor(Math.random() * 15) + 8, workOrders);

    return {
      ...c,
      workOrders,
      workers
    } as Contractor;
  });
};

export const MOCK_CONTRACTORS: Contractor[] = createMockData();
