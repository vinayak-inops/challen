

import { VerificationType, VerificationResult } from '../types';

// IDfy Credentials
const IDFY_ACCOUNT_ID = '13c0e1989564/cc6978f1-0b60-45f8-bb34-9d827346eb1e';
const IDFY_API_KEY = 'b582fcdc-3162-4b8e-b059-10a4d6d0af48';

// Gridlines Credentials
const GRIDLINES_API_KEY = '7sPBB5Zo5D4hZBZWkbCvjc7NR52lPbaK';

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to clean Base64 string (remove data:image/xyz;base64, prefix)
const cleanBase64 = (dataUrl: string): string => {
  if (dataUrl.includes(',')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
};

// New Function: Simulate sending OTP
export const sendVerificationOtp = async (type: 'AADHAAR' | 'PAN', identifier: string): Promise<{ sent: boolean; message: string }> => {
  await delay(1500); // Simulate network delay
  
  if (!identifier || identifier.length < 5) {
      throw new Error(`Invalid ${type === 'AADHAAR' ? 'Aadhaar' : 'PAN'} Number provided.`);
  }

  return {
    sent: true,
    message: `OTP sent to mobile linked with ${type === 'AADHAAR' ? 'Aadhaar' : 'PAN'} (XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)})`
  };
};

const verifyPanIdfy = async (inputs: Record<string, string>): Promise<VerificationResult> => {
  const { panNumber, fullName, dob, otp } = inputs;
  
  if (!panNumber || !fullName || !dob) {
    throw new Error("PAN Number, Full Name, and Date of Birth are required.");
  }

  // 1. Check if OTP is provided
  if (!otp) {
      throw new Error("OTP is required to verify PAN details.");
  }
  
  // Simulate OTP Validation
  await delay(1000);
  if (otp !== '123456') {
      throw new Error("Invalid OTP entered. Please try again.");
  }

  try {
    // In a real scenario with OTP, this might hit a specific endpoint. 
    // Here we proceed with the standard check now that OTP is "validated".
    
    // Fallback/Simulation Logic directly for this demo request
    return {
        status: 'VERIFIED',
        transactionId: `TXN-${Math.floor(Math.random() * 10000000)}`,
        timestamp: new Date().toISOString(),
        data: {
            pan_status: "Existing and Valid",
            name_match: 'Yes',
            dob_match: 'Yes',
            aadhaar_seeding: 'Linked',
            registered_name: fullName.toUpperCase(),
            otp_validation: "SUCCESS"
        }
    };

  } catch (error: any) {
    throw error;
  }
};

const verifyAadhaarIdfy = async (inputs: Record<string, string>): Promise<VerificationResult> => {
  const { aadhaarNumber, otp } = inputs;
  
  if (!aadhaarNumber) {
    throw new Error("Aadhaar Number is required.");
  }

  if (!otp) {
      throw new Error("Please enter the OTP sent to your mobile.");
  }

  try {
    await delay(1500);

    if (otp !== '123456') {
        throw new Error("Invalid OTP. Please enter '123456'.");
    }

    // Return Simulated Demographic Data
    return {
        status: 'VERIFIED',
        transactionId: `UIDAI-${Math.floor(Math.random() * 10000000)}`,
        timestamp: new Date().toISOString(),
        data: {
        name: "Nazma Khan",
        id_number: aadhaarNumber,
        dob: "1979-03-02",
        gender: "Female",
        address: "Xxx Xxxx Xxxxxxxxx , Xxxx Xxxxx Xxxxx , Xxxx Xxxx , Xxx Xxxxx - 000001",
        pincode: "000001",
        mobile_verified: "YES"
        },
        message: "Aadhaar e-KYC Successful"
    };

  } catch (error: any) {
    throw error;
  }
};

const verifyPoliceGridlines = async (inputs: Record<string, string>): Promise<VerificationResult> => {
  const { fullName, fatherName, dob, address, additionalAddress } = inputs;

  try {
    const referenceId = crypto.randomUUID();

    // 1. Initiate Request
    const generateResponse = await fetch('https://stoplight.io/mocks/gridlines/gridlines-api-docs/322908232/ccrv-api/generate-report', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': GRIDLINES_API_KEY,
        'X-Auth-Type': GRIDLINES_API_KEY, // Mock Auth Type same as Key
        'X-Reference-ID': referenceId
      },
      body: JSON.stringify({
        name: fullName,
        address: address,
        father_name: fatherName,
        additional_address: additionalAddress,
        date_of_birth: dob,
        consent: "Y"
      })
    });

    if (!generateResponse.ok) {
        throw new Error(`Initiate Failed: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    const transactionId = generateData.data?.transaction_id;

    if (!transactionId) {
        throw new Error("No transaction ID received from Police Verification Provider.");
    }

    // 2. Poll for Report
    let attempts = 0;
    while (attempts < 10) {
        await delay(2000);
        
        const reportResponse = await fetch('https://stoplight.io/mocks/gridlines/gridlines-api-docs/322908232/ccrv-api/fetch-report', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': GRIDLINES_API_KEY,
                'X-Auth-Type': GRIDLINES_API_KEY,
                'X-Reference-ID': referenceId,
                'X-Transaction-ID': transactionId
            }
        });

        if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            const ccrvStatus = reportData.data?.ccrv_status;

            if (ccrvStatus === 'COMPLETED') {
                const ccrvData = reportData.data?.ccrv_data;
                const cases = ccrvData?.cases || [];
                
                // If cases are found, return them. Even if result="FAILED", it means "Failed to clear", i.e. Records Found.
                if (cases.length > 0) {
                     return {
                        status: 'FAILED', // Changed from VERIFIED to FAILED because records were found
                        transactionId: transactionId,
                        timestamp: new Date().toISOString(),
                        message: "Police Records Found. Review Details Carefully.",
                        data: {
                            check_status: "CRIMINAL RECORD FOUND",
                            case_count: cases.length,
                            case_details: cases.map((c: any) => ({
                                case_id: c.caseCode || c.id,
                                filing_number: c.filing_number,
                                cnr_number: c.cnr_number,
                                court: c.court_type,
                                severity: c.criminal_act_severity,
                                status: c.case_status,
                                petitioner: Array.isArray(c.petitioner_name) ? c.petitioner_name.join(', ') : c.petitioner_name,
                                respondent: Array.isArray(c.respondent_name) ? c.respondent_name.join(', ') : c.respondent_name,
                                acts: c.acts?.map((a: any) => a.description || a.type).join(', ')
                            })),
                            report_remarks: ccrvData.report_status?.remarks || "Review Required"
                        }
                     };
                } else {
                     return {
                        status: 'VERIFIED',
                        transactionId: transactionId,
                        timestamp: new Date().toISOString(),
                        message: "No Criminal Records Found.",
                        data: {
                             check_status: "CLEAN",
                             remarks: "No court cases found matching the profile."
                        }
                     };
                }
            }
        }
        attempts++;
    }

    // Polling Timed Out - Return Simulated Data for Demo/Mock Stability
    throw new Error("Polling Timed Out");

  } catch (error: any) {
    
    // Fallback if 'Timed Out' was thrown or network failed (CORS)
    if ((error.name === 'TypeError' && error.message === 'Failed to fetch') || error.message.includes("Timed Out") || error.message.includes("Initiate Failed")) {
         return {
            status: 'FAILED', // Simulation has criminal records, so we mark it as FAILED
            transactionId: "1c9ed64e-c3d6-45d6-q4d1-aeea902ba0f8",
            timestamp: new Date().toISOString(),
            data: {
                 check_status: "CRIMINAL RECORD FOUND (Simulated)",
                 case_count: 1,
                 case_details: [{
                    case_id: "6877",
                    filing_number: "235/2014",
                    cnr_number: "ABDCE-000134-2011",
                    court: "DISTRICT_AND_SESSION_COURT",
                    severity: "HIGH",
                    status: "ONGOING",
                    petitioner: "1) Test Address - Test Advocate- Test",
                    respondent: "1) Test Address - Test Advocate- Test",
                    acts: "81409, Waging war (IPC)"
                 }],
                 note: "⚠️ Real API Verification Timed Out/Blocked. Showing simulated result from prompt data."
            },
            message: "Police Records Found (Simulated)"
         };
    }

    throw error;
  }
};

export const verifyIdentity = async (
  type: VerificationType,
  inputs: Record<string, string>
): Promise<VerificationResult> => {
  
  const txnId = `TXN-${Math.floor(Math.random() * 1000000)}`;
  const timestamp = new Date().toISOString();

  // 1. Aadhaar Verification (OTP Based)
  if (type === 'AADHAAR') {
    return await verifyAadhaarIdfy(inputs);
  }

  // 2. PAN Verification (OTP Based)
  if (type === 'PAN') {
    return await verifyPanIdfy(inputs);
  }

  // 3. Police Verification (Gridlines API)
  if (type === 'POLICE') {
    return await verifyPoliceGridlines(inputs);
  }

  // 4. Bank Account Verification Mock (Penny Drop)
  if (type === 'BANK') {
    await delay(1500);
    const { accountNumber, ifsc } = inputs;
    if (accountNumber && accountNumber.length > 8 && ifsc && ifsc.length === 11) {
      return {
        status: 'VERIFIED',
        transactionId: txnId,
        timestamp,
        data: {
          beneficiaryName: "RAPID WORKFORCE SOLUTIONS PVT LTD",
          bankReference: "REF" + Math.floor(Math.random() * 10000000),
          bankResponse: "Success"
        }
      };
    } else {
      return {
        status: 'FAILED',
        transactionId: txnId,
        timestamp,
        message: "Invalid Account Details or IFSC Code."
      };
    }
  }

  // 5. GST Verification Mock
  if (type === 'GST') {
    await delay(1500);
    const { gstNumber } = inputs;
    // Simple regex for GSTIN: 2 digits + PAN + 1 char + 1 char + 1 char
    const gstRegex = /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/;
    
    if (gstNumber && gstRegex.test(gstNumber)) {
      return {
        status: 'VERIFIED',
        transactionId: txnId,
        timestamp,
        data: {
          legalName: "APEX CONSTRUCTION SERVICES",
          tradeName: "APEX BUILDERS",
          status: "Active",
          registrationDate: "2019-04-01",
          taxpayerType: "Regular"
        }
      };
    } else {
      return {
        status: 'FAILED',
        transactionId: txnId,
        timestamp,
        message: "GSTIN format invalid or not found in GSTN."
      };
    }
  }

  return {
    status: 'FAILED',
    transactionId: txnId,
    timestamp,
    message: "Unknown verification type."
  };
};
