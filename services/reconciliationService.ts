
import { Contractor, Worker, ReconciliationRecord, ReconciliationSummary } from '../types';

// Constants for PF Calculation
const PF_RATE_EMPLOYEE = 0.12;
const PF_RATE_EMPLOYER = 0.12; // Simplified
const PF_WAGE_CEILING = 15000;

/**
 * Mocks the parsing of a CSV file. 
 * In a real scenario, this would use FileReader and split by lines/commas.
 * For this demo, it generates data based on existing workers to simulate a file that mostly matches but has some errors.
 */
export const parseChallanFile = async (file: File, allWorkers: Worker[]): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate reading the file. We will return an array of objects representing rows.
      // We'll take 80% of existing workers to simulate matches.
      // We'll add 2 random entries to simulate "Not Found in DB".
      
      const challanRows: any[] = [];
      
      // 1. Existing Workers (Matches & Mismatches)
      allWorkers.forEach((w, idx) => {
        // Skip some to simulate "Not Found in Challan"
        if (Math.random() > 0.8) return; 

        // Calculate "correct" values first to base the mock on
        // Assume full attendance for simplicity of generating the file base values
        const wage = w.dailyWage * 26; 
        const pfWage = Math.min(wage, PF_WAGE_CEILING);
        let pfAmount = Math.round(pfWage * PF_RATE_EMPLOYEE);

        // Intentionally create a mismatch for every 5th worker
        if (idx % 5 === 0) {
            pfAmount = pfAmount - 100; // Underpayment in challan
        }

        challanRows.push({
          UAN: `100${Math.floor(100000000 + Math.random() * 900000000)}`, // Dummy UAN for display, we match by Name/ID in this mock since UAN isn't in mock data
          Employee_Name: w.name,
          ID_Link: w.id, // Hidden link for mock matching
          Gross_Wages: wage,
          EPF_Wages: pfWage,
          EE_Share: pfAmount,
          ER_Share: pfAmount,
        });
      });

      // 2. Extra rows (Not Found in DB)
      challanRows.push({
        UAN: '101000000001',
        Employee_Name: 'External Worker A',
        ID_Link: 'unknown-1',
        Gross_Wages: 15000,
        EPF_Wages: 15000,
        EE_Share: 1800,
        ER_Share: 1800,
      });

      resolve(challanRows);
    }, 1500); // Simulate upload time
  });
};

/**
 * Main Reconciliation Logic
 */
export const runReconciliation = (
  monthYear: string, // YYYY-MM
  challanData: any[],
  contractors: Contractor[]
): { records: ReconciliationRecord[]; summary: ReconciliationSummary } => {
  
  const records: ReconciliationRecord[] = [];
  const allWorkers = contractors.flatMap(c => c.workers);
  
  let matchedCount = 0;
  let mismatchCount = 0;
  let notFoundInDbCount = 0;
  let totalCalculatedPF = 0;
  let totalChallanPF = 0;

  // 1. Process Challan Rows (Find Matches and Mismatches)
  challanData.forEach((row, idx) => {
    // Try to find worker in DB
    // In real app, match by UAN. Here matching by Name or mocked ID_Link
    const worker = allWorkers.find(w => w.name === row.Employee_Name || w.id === row.ID_Link);

    if (worker) {
      // Worker Found: Calculate System Values
      // Calculate Days Present in Selected Month
      const [year, month] = monthYear.split('-').map(Number);
      
      // Filter attendance for this month
      // Note: Mock data generates last 30 days relative to "today". 
      // For demo stability, we'll assume the mock attendance covers the requested period or default to ~22 days.
      const daysPresent = worker.attendance.filter(a => a.present).length || 22; 
      
      const calculatedWage = daysPresent * worker.dailyWage;
      const pfWage = Math.min(calculatedWage, PF_WAGE_CEILING);
      const calculatedPF = Math.round(pfWage * PF_RATE_EMPLOYEE);
      
      const challanPF = Number(row.EE_Share);
      const difference = challanPF - calculatedPF;
      
      const isMatch = Math.abs(difference) <= 2; // Allow small rounding diff
      
      if (isMatch) matchedCount++;
      else mismatchCount++;

      totalCalculatedPF += calculatedPF;
      totalChallanPF += challanPF;

      records.push({
        id: `rec-${idx}`,
        uan: row.UAN,
        employeeName: row.Employee_Name,
        category: 'Challan',
        daysPresent: daysPresent,
        calculatedWage: calculatedWage,
        calculatedPF: calculatedPF,
        challanWage: Number(row.Gross_Wages),
        challanPF: challanPF,
        difference: difference,
        status: isMatch ? 'MATCH' : 'MISMATCH',
        remarks: isMatch ? 'OK' : `Discrepancy of ₹${difference}`
      });

    } else {
      // Not Found in DB
      notFoundInDbCount++;
      totalChallanPF += Number(row.EE_Share);
      
      records.push({
        id: `rec-${idx}`,
        uan: row.UAN,
        employeeName: row.Employee_Name,
        category: 'Challan',
        daysPresent: 0,
        calculatedWage: 0,
        calculatedPF: 0,
        challanWage: Number(row.Gross_Wages),
        challanPF: Number(row.EE_Share),
        difference: Number(row.EE_Share),
        status: 'NOT_FOUND_IN_DB',
        remarks: 'Employee exists in Challan but not in System'
      });
    }
  });

  // 2. Identify Employees in DB but NOT in Challan
  const challanNames = new Set(challanData.map(r => r.Employee_Name));
  const missingWorkers = allWorkers.filter(w => !challanNames.has(w.name));

  missingWorkers.forEach((w, idx) => {
     // Calculate what SHOULD have been paid
     const daysPresent = w.attendance.filter(a => a.present).length || 22;
     const calculatedWage = daysPresent * w.dailyWage;
     const pfWage = Math.min(calculatedWage, PF_WAGE_CEILING);
     const calculatedPF = Math.round(pfWage * PF_RATE_EMPLOYEE);

     totalCalculatedPF += calculatedPF;

     records.push({
        id: `missing-${idx}`,
        uan: 'N/A',
        employeeName: w.name,
        category: 'System',
        daysPresent: daysPresent,
        calculatedWage: calculatedWage,
        calculatedPF: calculatedPF,
        challanWage: 0,
        challanPF: 0,
        difference: -calculatedPF,
        status: 'NOT_FOUND_IN_CHALLAN',
        remarks: 'Employee active in System but missing in Challan'
     });
  });

  const notFoundInChallanCount = missingWorkers.length;
  const netDifference = totalChallanPF - totalCalculatedPF;

  return {
    records,
    summary: {
      totalRecords: records.length,
      matchedCount,
      mismatchCount,
      notFoundInDbCount,
      notFoundInChallanCount,
      totalCalculatedPF,
      totalChallanPF,
      netDifference
    }
  };
};
