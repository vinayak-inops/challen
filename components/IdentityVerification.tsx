

import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Landmark, FileBadge, Loader2, CheckCircle, XCircle, RefreshCw, UploadCloud, ScanLine, Gavel, AlertTriangle, FileWarning, Scale, Users, Smartphone, MessageSquare } from 'lucide-react';
import { verifyIdentity, sendVerificationOtp } from '../services/apiSetuService';
import { VerificationType, VerificationResult } from '../types';

const IdentityVerification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VerificationType>('AADHAAR');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    const val = field.includes('Number') || field === 'ifsc' || field === 'gstNumber' ? value.toUpperCase() : value;
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const handleSendOtp = async () => {
      setIsLoading(true);
      setResult(null);
      try {
          const identifier = activeTab === 'AADHAAR' ? inputs.aadhaarNumber : inputs.panNumber;
          await sendVerificationOtp(activeTab === 'AADHAAR' ? 'AADHAAR' : 'PAN', identifier);
          setOtpSent(true);
          setOtpTimer(30);
          // Start countdown
          const interval = setInterval(() => {
             setOtpTimer(prev => {
                if (prev <= 1) clearInterval(interval);
                return prev - 1;
             });
          }, 1000);
      } catch (error) {
         setResult({
            status: 'FAILED', transactionId: 'ERR', timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : "Failed to send OTP."
         });
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await verifyIdentity(activeTab, inputs);
      setResult(res);
      // Reset after success if needed, or keep to show result
      if (res.status === 'VERIFIED') {
         setOtpSent(false); // Reset flow
      }
    } catch (error) {
      setResult({
        status: 'FAILED', transactionId: 'ERR', timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "System error."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    switch (activeTab) {
      case 'AADHAAR': return !!inputs.aadhaarNumber && inputs.aadhaarNumber.length >= 12;
      case 'PAN': return !!inputs.panNumber && !!inputs.fullName && !!inputs.dob;
      case 'POLICE': return !!inputs.fullName && !!inputs.fatherName && !!inputs.dob && !!inputs.address;
      case 'BANK': return !!inputs.accountNumber && !!inputs.ifsc;
      case 'GST': return !!inputs.gstNumber;
      default: return false;
    }
  };

  const resetState = (tabId: VerificationType) => {
      setActiveTab(tabId);
      setInputs({});
      setResult(null);
      setOtpSent(false);
      setOtpTimer(0);
  };

  const tabs = [
    { id: 'AADHAAR', label: 'Aadhaar', icon: ShieldCheck },
    { id: 'PAN', label: 'PAN Card', icon: CreditCard },
    { id: 'POLICE', label: 'Police Check', icon: Gavel },
    { id: 'BANK', label: 'Bank Account', icon: Landmark },
    { id: 'GST', label: 'GSTIN', icon: FileBadge },
  ];

  const requiresOtp = activeTab === 'AADHAAR' || activeTab === 'PAN';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-normal text-slate-800">Identity Verification</h1>
         <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Gov API Gateway Active
         </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Google Style Tabs */}
        <div className="border-b border-slate-200 flex px-2 bg-slate-50">
           {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => resetState(tab.id as VerificationType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                     isActive ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
           })}
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Left Form */}
           <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 bg-white">
              <h3 className="text-lg font-medium text-slate-800 mb-6">Enter details for {tabs.find(t => t.id === activeTab)?.label}</h3>
              
              {/* Form Content */}
              <div className="space-y-5">
                 
                 {activeTab === 'AADHAAR' && (
                    <div className="space-y-4">
                       <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded border border-blue-100 flex gap-2">
                          <Smartphone size={16} className="mt-0.5" />
                          <span>We will send an OTP to the mobile linked with this Aadhaar.</span>
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Aadhaar Number *</label>
                          <input 
                             type="text" 
                             maxLength={12} 
                             placeholder="0000 0000 0000" 
                             className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono" 
                             value={inputs.aadhaarNumber || ''} 
                             onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g,''))} 
                             disabled={otpSent}
                          />
                       </div>
                    </div>
                 )}

                 {activeTab !== 'AADHAAR' && (
                    <div className="space-y-4">
                        {activeTab === 'PAN' && (
                           <>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">PAN Number *</label>
                                <input type="text" maxLength={10} placeholder="ABCDE1234F" className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.panNumber || ''} onChange={(e) => handleInputChange('panNumber', e.target.value)} disabled={otpSent} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Full Name *</label>
                                <input type="text" placeholder="As per PAN" className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.fullName || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={otpSent} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Date of Birth *</label>
                                <input type="date" className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.dob || ''} onChange={(e) => handleInputChange('dob', e.target.value)} disabled={otpSent} />
                             </div>
                           </>
                        )}
                        {activeTab === 'POLICE' && (
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1 col-span-2"><label className="text-xs font-medium text-slate-500">Full Name *</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={inputs.fullName || ''} onChange={(e) => handleInputChange('fullName', e.target.value)}/></div>
                               <div className="space-y-1"><label className="text-xs font-medium text-slate-500">Father Name *</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={inputs.fatherName || ''} onChange={(e) => handleInputChange('fatherName', e.target.value)}/></div>
                               <div className="space-y-1"><label className="text-xs font-medium text-slate-500">DOB *</label><input type="date" className="w-full p-2.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={inputs.dob || ''} onChange={(e) => handleInputChange('dob', e.target.value)}/></div>
                               <div className="space-y-1 col-span-2"><label className="text-xs font-medium text-slate-500">Current Address *</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={inputs.address || ''} onChange={(e) => handleInputChange('address', e.target.value)}/></div>
                            </div>
                        )}
                         {activeTab === 'BANK' && (
                           <>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Account Number *</label>
                                <input type="text" className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.accountNumber || ''} onChange={(e) => handleInputChange('accountNumber', e.target.value)} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">IFSC Code *</label>
                                <input type="text" maxLength={11} className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.ifsc || ''} onChange={(e) => handleInputChange('ifsc', e.target.value)} />
                             </div>
                           </>
                        )}
                        {activeTab === 'GST' && (
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">GSTIN *</label>
                                <input type="text" maxLength={15} className="w-full p-2.5 bg-white border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={inputs.gstNumber || ''} onChange={(e) => handleInputChange('gstNumber', e.target.value)} />
                             </div>
                        )}
                    </div>
                 )}

                 {/* OTP Input Section for Aadhaar/PAN */}
                 {requiresOtp && otpSent && (
                     <div className="space-y-2 animate-fade-in bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-bold text-slate-500 uppercase">Enter OTP</label>
                             <span className="text-xs text-blue-600 font-medium">{otpTimer > 0 ? `Resend in ${otpTimer}s` : <button onClick={handleSendOtp} className="hover:underline">Resend OTP</button>}</span>
                         </div>
                         <div className="relative">
                            <input 
                                type="text" 
                                maxLength={6} 
                                placeholder="123456" 
                                className="w-full p-2.5 pl-10 bg-white border border-blue-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all tracking-widest font-mono" 
                                value={inputs.otp || ''} 
                                onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g,''))} 
                            />
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         </div>
                         <p className="text-[10px] text-slate-400">Hint: Use 123456 for demo</p>
                     </div>
                 )}

              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                 {/* 2-Step Button Logic */}
                 {requiresOtp && !otpSent ? (
                     <button 
                        onClick={handleSendOtp} 
                        disabled={isLoading || !isFormValid()} 
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded shadow-sm flex items-center gap-2 transition-all"
                     >
                        {isLoading && <Loader2 size={16} className="animate-spin" />} Send OTP
                     </button>
                 ) : (
                     <button 
                        onClick={handleVerify} 
                        disabled={isLoading || !isFormValid() || (requiresOtp && !inputs.otp)} 
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded shadow-sm flex items-center gap-2 transition-all"
                     >
                        {isLoading && <Loader2 size={16} className="animate-spin" />} Verify & Submit
                     </button>
                 )}
              </div>
           </div>

           {/* Right Result Panel */}
           <div className="w-1/2 bg-slate-50 p-8 overflow-y-auto">
              {result ? (
                 <div className="bg-white rounded border border-slate-200 shadow-sm p-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        {result.status === 'VERIFIED' ? <CheckCircle className="text-emerald-500" size={24}/> : <XCircle className="text-red-500" size={24}/>}
                        <div>
                           <h4 className={`text-lg font-medium ${result.status === 'VERIFIED' ? 'text-emerald-700' : 'text-red-700'}`}>{result.status === 'VERIFIED' ? 'Verified' : 'Verification Failed'}</h4>
                           <p className="text-xs text-slate-400 font-mono">{result.transactionId}</p>
                        </div>
                    </div>
                    
                    {result.data && (
                       <div className="space-y-4">
                          {Object.entries(result.data).map(([key, value]) => {
                             if (key === 'note') return null;
                             if (Array.isArray(value)) return <div key={key} className="text-xs"><span className="font-bold uppercase text-slate-500">{key}</span>: {value.length} items</div>;

                             return (
                                <div key={key} className="grid grid-cols-3 gap-2 text-sm border-b border-slate-50 pb-2">
                                   <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                   <span className="col-span-2 font-medium text-slate-800 text-right">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                </div>
                             )
                          })}
                          {result.data.note && (
                             <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-100 flex gap-2">
                                <AlertTriangle size={14} className="shrink-0" /> {result.data.note}
                             </div>
                          )}
                       </div>
                    )}
                    {result.message && !result.data && <p className="text-sm text-slate-600">{result.message}</p>}
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShieldCheck size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Result will appear here</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerification;
