import { Contractor } from '../types';
import { MOCK_CONTRACTORS } from '../constants';

class MongoSimulator {
  private connectionString: string;
  private isConnected: boolean = false;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    this.isConnected = true;
  }

  async find(dbName: string, collection: string, query: any = {}): Promise<any[]> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate query time

    // 1. ContractLabour.contractor: Returns basic contractor profiles
    if (dbName === 'ContractLabour' && collection === 'contractor') {
      return MOCK_CONTRACTORS.map(({ workers, ...rest }) => rest);
    }

    // 2. ContractLabour.contractor-employee: Returns list of workers linked to contractors
    if (dbName === 'ContractLabour' && collection === 'contractor-employee') {
      return MOCK_CONTRACTORS.flatMap(c => 
        c.workers.map(({ attendance, ...workerDetails }) => ({
            ...workerDetails,
            contractorId: c.id // Ensure linkage exists
        }))
      );
    }

    // 3. MusterPunchData.muster: Returns raw attendance logs linked to workers
    if (dbName === 'MusterPunchData' && collection === 'muster') {
      return MOCK_CONTRACTORS.flatMap(c => 
        c.workers.map(w => ({
          workerId: w.id,
          punchRecords: w.attendance // simulating raw muster data
        }))
      );
    }

    return [];
  }
}

// Initialize with provided credentials
export const dbClient = new MongoSimulator("mongodb://admin:password@122.166.245.97:27017/");

export const fetchCLMSData = async (): Promise<Contractor[]> => {
  try {
    await dbClient.connect();

    // Parallel execution of queries to different collections/databases
    const [contractorsRaw, employeesRaw, musterRaw] = await Promise.all([
      dbClient.find('ContractLabour', 'contractor'),
      dbClient.find('ContractLabour', 'contractor-employee'),
      dbClient.find('MusterPunchData', 'muster')
    ]);

    // In-memory Join / Aggregation Logic
    // This simulates what might happen in a complex MongoDB $lookup pipeline or backend service
    const mergedData = contractorsRaw.map((contractor: any) => {
      // 1. Join Contractor -> Employees
      const contractorEmployees = employeesRaw.filter((emp: any) => emp.contractorId === contractor.id);

      // 2. Join Employee -> Muster Data
      const fullWorkers = contractorEmployees.map((emp: any) => {
        const employeeMuster = musterRaw.find((m: any) => m.workerId === emp.id);
        return {
          ...emp,
          attendance: employeeMuster ? employeeMuster.punchRecords : []
        };
      });

      return {
        ...contractor,
        workers: fullWorkers
      };
    });

    return mergedData;
  } catch (error) {
    throw error;
  }
};