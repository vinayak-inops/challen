
import React, { useState } from 'react';
import { Worker, VerificationResult } from '../types';
import { verifyIdentity, sendVerificationOtp } from '../services/apiSetuService';
import { ArrowLeft, ArrowRight, ShieldCheck, CreditCard, Gavel, Landmark, CheckCircle, XCircle, AlertCircle, Loader2, UploadCloud, FileText, Smartphone, MessageSquare, FileDown, Printer, AlertOctagon, Fingerprint, Building, ScrollText, Clock } from 'lucide-react';

interface VerificationWorkflowProps {
  worker: Worker;
  onUpdateWorker: (updatedWorker: Worker) => void;
  onBack: () => void;
}

// Official Logos for Indian Context - Updated to reliable PNG sources
const steps = [
  { 
    id: 'aadhaar', 
    label: 'Aadhaar Check', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/c/cf/Aadhaar_Logo.svg',
    icon: ShieldCheck 
  },
  { 
    id: 'pan', 
    label: 'PAN Verification', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Income_Tax_Department_India_Logo.png/480px-Income_Tax_Department_India_Logo.png',
    icon: CreditCard 
  },
  { 
    id: 'police', 
    label: 'Police Clearance', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/414px-Emblem_of_India.svg.png', 
    icon: Gavel 
  },
  { 
    id: 'bank', 
    label: 'Bank Validation', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Reserve_Bank_of_India_logo.svg/480px-Reserve_Bank_of_India_logo.svg.png',
    icon: Landmark 
  },
  { 
    id: 'summary', 
    label: 'Completion', 
    icon: CheckCircle 
  },
];

const VerificationWorkflow: React.FC<VerificationWorkflowProps> = ({ worker, onUpdateWorker, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // Input States
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Helper for dynamic icon/logo rendering
  const currentStepDef = steps[currentStep];
  const StepIcon = currentStepDef.icon;

  const isVerified = (
      (currentStep === 0 && worker.verification.aadhaar === 'VERIFIED') ||
      (currentStep === 1 && worker.verification.pan === 'VERIFIED') ||
      (currentStep === 2 && worker.verification.police === 'VERIFIED') ||
      (currentStep === 3 && worker.verification.bank === 'VERIFIED')
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) { 
        setCurrentStep(prev => prev + 1); 
        setResult(null); 
        setError(null); 
        setInputs({});
        setOtpSent(false);
    } else { 
        onBack(); 
    }
  };

  const handleBack = () => {
    if (currentStep > 0) { 
        setCurrentStep(prev => prev - 1); 
        setResult(null); 
        setError(null);
        setInputs({});
        setOtpSent(false);
    } else { 
        onBack(); 
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const updateWorkerStatus = (type: 'aadhaar' | 'pan' | 'police' | 'bank', status: 'VERIFIED' | 'FAILED') => {
    onUpdateWorker({ ...worker, verification: { ...worker.verification, [type]: status } });
  };

  const handleSendOtp = async () => {
      setIsLoading(true); setError(null);
      try {
          const identifier = currentStep === 0 ? worker.aadhaarNumber : worker.panNumber;
          await sendVerificationOtp(currentStep === 0 ? 'AADHAAR' : 'PAN', identifier);
          setOtpSent(true);
          setOtpTimer(30);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const runVerification = async () => {
    setIsLoading(true); setError(null);
    try {
      let res: VerificationResult;
      switch (currentStep) {
        case 0:
          if (!inputs.otp) throw new Error("Please enter OTP.");
          res = await verifyIdentity('AADHAAR', { aadhaarNumber: worker.aadhaarNumber, otp: inputs.otp });
          updateWorkerStatus('aadhaar', res.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED');
          break;
        case 1:
          if (!inputs.otp) throw new Error("Please enter OTP.");
          res = await verifyIdentity('PAN', { panNumber: worker.panNumber, fullName: worker.name, dob: worker.dob, otp: inputs.otp });
          updateWorkerStatus('pan', res.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED');
          break;
        case 2:
          res = await verifyIdentity('POLICE', { fullName: worker.name, fatherName: worker.fatherName, dob: worker.dob, address: worker.address, additionalAddress: worker.address });
          updateWorkerStatus('police', res.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED');
          break;
        case 3:
          res = await verifyIdentity('BANK', { accountNumber: worker.bankDetails.accountNumber, ifsc: worker.bankDetails.ifsc });
          updateWorkerStatus('bank', res.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED');
          break;
        default: throw new Error("Invalid step");
      }
      setResult(res);
      if (res.status === 'VERIFIED') setOtpSent(false);
    } catch (err: any) {
      setError(err.message); setResult({ status: 'FAILED', transactionId: 'ERR', timestamp: new Date().toISOString(), message: err.message });
    } finally { setIsLoading(false); }
  };

  const renderResultData = (data: any) => {
    if (!data) return null;
    return (
        <div className="space-y-3 mt-2">
            {Object.entries(data).map(([key, value]) => {
                if (key === 'note') return null;
                // Handle nested arrays (e.g., Police Cases)
                if (Array.isArray(value)) {
                    return (
                        <div key={key} className="mt-2">
                            <div className="text-xs font-bold uppercase text-slate-500 mb-1">{key.replace(/_/g, ' ')} ({value.length})</div>
                            <div className="space-y-2">
                                {value.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-3 rounded border border-red-100 shadow-sm text-xs">
                                        {Object.entries(item).map(([k, v]) => (
                                            <div key={k} className="grid grid-cols-3 gap-1 mb-1">
                                                <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                                                <span className="col-span-2 font-medium text-slate-800">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={key} className="flex justify-between text-xs border-b border-slate-200/50 pb-1 last:border-0">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-slate-800 text-right max-w-[60%] truncate" title={String(value)}>{String(value)}</span>
                    </div>
                );
            })}
            {data.note && (
                <div className="mt-3 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                    <span>{data.note}</span>
                </div>
            )}
        </div>
    );
  };

  const renderActionButtons = () => {
      // Step 0 and 1 (Aadhaar/PAN) require OTP flow
      if (!isVerified && (currentStep === 0 || currentStep === 1)) {
          if (!otpSent) {
              return (
                <button onClick={handleSendOtp} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">
                    {isLoading && <Loader2 className="animate-spin" size={16} />} Send OTP
                </button>
              );
          } else {
              return (
                <button onClick={runVerification} disabled={isLoading || !inputs.otp} className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-emerald-700 disabled:bg-slate-300 transition-colors shadow-sm">
                    {isLoading && <Loader2 className="animate-spin" size={16} />} Verify OTP
                </button>
              );
          }
      } 
      
      // Standard flow for other steps or if already verified
      if (!isVerified) {
        return (
            <button onClick={runVerification} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm">
                {isLoading && <Loader2 className="animate-spin" size={16} />} Run Verification
            </button>
        );
      }
      return null;
  };

  const renderCompletionSummary = () => {
    const checks = [
        { id: 'aadhaar', label: 'Aadhaar Check', status: worker.verification.aadhaar, details: "Biometric & Demographic Match", icon: Fingerprint },
        { id: 'pan', label: 'PAN Verification', status: worker.verification.pan, details: "Income Tax Database Validated", icon: FileText },
        { id: 'police', label: 'Police Clearance', status: worker.verification.police, details: "National Crime Records Search", icon: Gavel },
        { id: 'bank', label: 'Bank Validation', status: worker.verification.bank, details: "Penny Drop Verified", icon: Building },
    ];

    const passedCount = checks.filter(c => c.status === 'VERIFIED').length;
    const score = (passedCount / 4) * 100;
    const isCritical = checks.some(c => c.status === 'FAILED');

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header / Score Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritical ? 'bg-red-500' : (score === 100 ? 'bg-emerald-500' : 'bg-amber-500')}`}></div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Executive Compliance Dossier</h2>
                    <p className="text-sm text-slate-500 mt-1">Verification Report for <span className="font-semibold text-slate-700">{worker.name}</span> ({worker.id})</p>
                    <div className="flex gap-3 mt-4">
                        <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isCritical ? 'bg-red-100 text-red-700' : (score === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}`}>
                             {isCritical ? <AlertOctagon size={14}/> : <ShieldCheck size={14}/>}
                             {isCritical ? 'High Risk' : (score === 100 ? 'Low Risk' : 'Medium Risk')}
                        </div>
                        <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                            <Clock size={14} /> Generated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div className="text-center px-6 border-l border-slate-100">
                    <div className="text-4xl font-black text-slate-800">{score}%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">Compliance Score</div>
                </div>
            </div>

            {/* Detailed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checks.map((check) => {
                    const CheckIcon = check.icon;
                    const isPassed = check.status === 'VERIFIED';
                    const isFailed = check.status === 'FAILED';
                    
                    return (
                        <div key={check.id} className={`p-5 rounded-lg border flex flex-col justify-between transition-all ${isPassed ? 'bg-white border-slate-200' : (isFailed ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200 opacity-70')}`}>
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPassed ? 'bg-blue-50 text-blue-600' : (isFailed ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500')}`}>
                                        <CheckIcon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">{check.label}</h4>
                                        <p className="text-xs text-slate-500">{check.details}</p>
                                    </div>
                                </div>
                                <div>
                                    {isPassed && <CheckCircle className="text-emerald-500" size={20} />}
                                    {isFailed && <XCircle className="text-red-500" size={20} />}
                                    {check.status === 'PENDING' && <AlertCircle className="text-slate-400" size={20} />}
                                </div>
                             </div>
                             
                             {/* Summary Lines */}
                             <div className="space-y-2 pt-4 border-t border-dashed border-slate-200/60">
                                 <div className="flex justify-between text-xs">
                                     <span className="text-slate-500">Validation Status</span>
                                     <span className={`font-bold ${isPassed ? 'text-emerald-700' : (isFailed ? 'text-red-700' : 'text-slate-500')}`}>
                                        {check.status}
                                     </span>
                                 </div>
                                 <div className="flex justify-between text-xs">
                                     <span className="text-slate-500">Last Updated</span>
                                     <span className="font-mono text-slate-700">{new Date().toLocaleTimeString()}</span>
                                 </div>
                                 {isFailed && (
                                     <div className="mt-2 text-xs bg-red-100 text-red-800 p-2 rounded">
                                         <strong>Recommendation:</strong> Manual Review Required. Document mismatch detected.
                                     </div>
                                 )}
                             </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Printer size={16} /> Print Dossier
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <FileDown size={16} /> Download PDF
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
       <div className="flex items-center justify-between shrink-0">
            <div>
                <h2 className="text-2xl font-normal text-slate-800">Verification Wizard</h2>
                <p className="text-sm text-slate-500">Employee: {worker.name} ({worker.id})</p>
            </div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm font-medium border border-slate-300 px-3 py-1.5 rounded-md hover:bg-white transition-colors">Exit</button>
       </div>

       <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex overflow-hidden">
           {/* Steps Sidebar */}
           <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto shrink-0">
                {steps.map((step, idx) => {
                    const status = idx === 4 ? 'pending' : worker.verification[step.id as keyof typeof worker.verification] || 'PENDING';
                    const isDone = status === 'VERIFIED';
                    const isFailed = status === 'FAILED';
                    const isActive = currentStep === idx;
                    const StepIconComp = step.icon;

                    return (
                        <div key={step.id} className={`flex items-center gap-3 p-3 rounded-md mb-1 transition-colors ${isActive ? 'bg-blue-50 border border-blue-100' : 'text-slate-500'}`}>
                            {/* Logo or Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 p-1 bg-white border ${isActive ? 'border-blue-200' : 'border-slate-200'}`}>
                                {step.logo ? (
                                    <img src={step.logo} alt={step.label} className="w-full h-full object-contain" />
                                ) : (
                                    <StepIconComp size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                )}
                            </div>
                            
                            {/* Label & Status */}
                            <div className="flex-1">
                                <span className={`text-sm font-medium block ${isActive ? 'text-blue-700' : ''}`}>{step.label}</span>
                                {isDone && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Verified</span>}
                                {isFailed && <span className="text-[10px] text-red-600 font-bold flex items-center gap-1"><XCircle size={10} /> Failed</span>}
                            </div>
                        </div>
                    );
                })}
           </div>

           {/* Content */}
           <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8">
                    {currentStep === 4 ? (
                         renderCompletionSummary()
                    ) : (
                        <div className="max-w-2xl mx-auto">
                             <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center gap-3">
                                {currentStepDef.logo ? (
                                   <img src={currentStepDef.logo} alt={currentStepDef.label} className="w-8 h-8 object-contain" />
                                ) : (
                                   <StepIcon className="text-blue-600" size={24} />
                                )}
                                {currentStepDef.label}
                             </h3>

                             {/* Context Information */}
                             <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm grid grid-cols-2 gap-4 mb-6">
                                     {currentStep === 0 && (
                                        <>
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details to Verify</div>
                                            <div><span className="text-slate-500 block text-xs">Aadhaar Number</span><span className="font-mono font-medium">{worker.aadhaarNumber}</span></div>
                                            <div><span className="text-slate-500 block text-xs">Name</span><span className="font-medium">{worker.name}</span></div>
                                        </>
                                     )}
                                     {currentStep === 1 && (
                                        <>
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details to Verify</div>
                                            <div><span className="text-slate-500 block text-xs">PAN Number</span><span className="font-mono font-medium">{worker.panNumber}</span></div>
                                            <div><span className="text-slate-500 block text-xs">Full Name</span><span className="font-medium">{worker.name}</span></div>
                                            <div><span className="text-slate-500 block text-xs">Date of Birth</span><span className="font-mono font-medium">{worker.dob}</span></div>
                                        </>
                                     )}
                                     {currentStep === 2 && (
                                        <>
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details to Verify</div>
                                            <div><span className="text-slate-500 block text-xs">Full Name</span><span className="font-medium">{worker.name}</span></div>
                                            <div><span className="text-slate-500 block text-xs">Father's Name</span><span className="font-medium">{worker.fatherName}</span></div>
                                            <div className="col-span-2"><span className="text-slate-500 block text-xs">Address</span><span className="font-medium">{worker.address}</span></div>
                                        </>
                                     )}
                                     {currentStep === 3 && (
                                        <>
                                            <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Details to Verify</div>
                                            <div><span className="text-slate-500 block text-xs">Account Number</span><span className="font-mono font-medium">{worker.bankDetails.accountNumber}</span></div>
                                            <div><span className="text-slate-500 block text-xs">IFSC Code</span><span className="font-mono font-medium">{worker.bankDetails.ifsc}</span></div>
                                            <div className="col-span-2"><span className="text-slate-500 block text-xs">Bank Name</span><span className="font-medium">{worker.bankDetails.bankName}</span></div>
                                        </>
                                     )}
                             </div>
                             
                             {/* OTP Input for Step 0 and 1 */}
                             {(currentStep === 0 || currentStep === 1) && !isVerified && otpSent && (
                                 <div className="mb-6 space-y-2 animate-fade-in bg-blue-50/50 p-4 rounded border border-blue-100">
                                     <label className="text-xs font-bold text-slate-500 uppercase">Enter OTP (Hint: 123456)</label>
                                     <div className="relative">
                                        <input 
                                            type="text" 
                                            maxLength={6} 
                                            className="w-full p-2.5 pl-10 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all tracking-widest font-mono" 
                                            value={inputs.otp || ''} 
                                            onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g,''))} 
                                        />
                                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                     </div>
                                 </div>
                             )}
                             
                             {/* Verification Trigger */}
                             {renderActionButtons()}

                             {/* Error Message */}
                             {error && (
                                 <div className="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-100 flex items-center gap-2">
                                     <AlertCircle size={16} /> {error}
                                 </div>
                             )}

                             {/* Result Display */}
                             {result && (
                                 <div className={`mt-6 p-4 rounded border animate-fade-in ${result.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                     <div className="flex items-center gap-2 font-medium mb-3 pb-3 border-b border-black/5">
                                         {result.status === 'VERIFIED' ? <CheckCircle className="text-emerald-600" size={18}/> : <XCircle className="text-red-600" size={18}/>}
                                         <span className={result.status === 'VERIFIED' ? 'text-emerald-800' : 'text-red-800'}>{result.message}</span>
                                     </div>
                                     <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {renderResultData(result.data)}
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="p-6 bg-white border-t border-slate-200 flex justify-between shrink-0">
                    <button onClick={handleBack} disabled={currentStep === 0} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm disabled:opacity-50">Back</button>
                    <button 
                        onClick={handleNext} 
                        className={`px-4 py-2 rounded-md font-medium text-sm text-white flex items-center gap-2 shadow-sm transition-colors ${isVerified || currentStep === 4 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 hover:bg-slate-500'}`}
                    >
                         {currentStep < steps.length - 1 ? (isVerified ? 'Next Step' : 'Skip Step') : 'Finish'} <ArrowRight size={16} />
                    </button>
                </div>
           </div>
       </div>
    </div>
  );
};

export default VerificationWorkflow;
