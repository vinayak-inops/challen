
import React, { useState } from 'react';
import { Worker } from '../types';
import { Search, ChevronRight, User, CheckSquare, UserPlus, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import VerificationWorkflow from './VerificationWorkflow';

interface EmployeeListProps {
  workers: Worker[];
  onUpdateWorkers: (updatedWorker: Worker) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ workers, onUpdateWorkers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [onboardedIds, setOnboardedIds] = useState<Set<string>>(new Set());

  // Helper to check if a worker is fully verified
  const isFullyVerified = (w: Worker) => {
    const v = w.verification;
    return v.aadhaar === 'VERIFIED' && v.pan === 'VERIFIED' && v.police === 'VERIFIED' && v.bank === 'VERIFIED';
  };

  // Filter logic
  const filteredWorkers = workers
    .filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.id.includes(searchTerm))
    // Optional: filter out already onboarded if desired, or just show status
    .slice(0, 10);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAllVerified = () => {
    const verifiedIds = filteredWorkers.filter(w => isFullyVerified(w) && !onboardedIds.has(w.id)).map(w => w.id);
    // Toggle: if all validated are selected, deselect them. Otherwise select all.
    const allSelected = verifiedIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(verifiedIds));
    }
  };

  const handleOnboard = () => {
    // In a real app, this would make an API call
    const newOnboarded = new Set(onboardedIds);
    selectedIds.forEach(id => newOnboarded.add(id));
    setOnboardedIds(newOnboarded);
    setSelectedIds(new Set()); // Clear selection
    alert(`Successfully onboarded ${selectedIds.size} employees!`);
  };

  if (selectedWorker) {
    return (
        <VerificationWorkflow 
            worker={selectedWorker}
            onUpdateWorker={(updated) => { onUpdateWorkers(updated); setSelectedWorker(updated); }}
            onBack={() => setSelectedWorker(null)}
        />
    );
  }

  // Google Console Style Table Header
  const TableHeader = ({ children, align = 'left', className = '' }: { children: React.ReactNode, align?: 'left'|'right'|'center', className?: string }) => (
     <th className={`px-6 py-3 border-b border-slate-200 bg-slate-50 text-${align} text-xs font-medium text-slate-500 uppercase tracking-wider ${className}`}>
        {children}
     </th>
  );

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-normal text-slate-800">Employees</h1>
         <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search by name or ID..." 
               className="pl-9 pr-4 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm w-64 shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col flex-1 mb-16">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse">
            <thead>
                <tr>
                    <TableHeader className="w-12 text-center">
                        <span className="sr-only">Select</span>
                    </TableHeader>
                    <TableHeader>Employee Profile</TableHeader>
                    <TableHeader>Verifications</TableHeader>
                    <TableHeader>Completeness</TableHeader>
                    <TableHeader>Summary</TableHeader>
                    <TableHeader align="right">Action</TableHeader>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
                {filteredWorkers.map(worker => {
                    const checks = Object.values(worker.verification || { aadhaar: 'PENDING', pan: 'PENDING', police: 'PENDING', bank: 'PENDING' });
                    const completed = checks.filter(s => s === 'VERIFIED').length;
                    const failed = checks.filter(s => s === 'FAILED').length;
                    const progress = Math.round((completed / 4) * 100);
                    const verified = isFullyVerified(worker);
                    const isOnboarded = onboardedIds.has(worker.id);
                    const isSelected = selectedIds.has(worker.id);

                    // Determine Summary Status
                    let summaryBadge;
                    if (isOnboarded) {
                        summaryBadge = (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle2 size={12} /> Active Employee
                            </span>
                        );
                    } else if (failed > 0) {
                        summaryBadge = (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                <AlertTriangle size={12} /> Action Required
                            </span>
                        );
                    } else if (verified) {
                        summaryBadge = (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <CheckSquare size={12} /> Ready to Onboard
                            </span>
                        );
                    } else {
                        summaryBadge = (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                <Clock size={12} /> In Progress
                            </span>
                        );
                    }

                    return (
                        <tr key={worker.id} className={`transition-colors group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-3 text-center">
                                {isOnboarded ? (
                                    <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                ) : (
                                    <input 
                                        type="checkbox" 
                                        disabled={!verified}
                                        checked={isSelected}
                                        onChange={() => toggleSelection(worker.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    />
                                )}
                            </td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isOnboarded ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'}`}>
                                        {worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">
                                            {worker.name} 
                                        </div>
                                        <div className="text-xs text-slate-500">{worker.type} • {worker.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <div className="flex gap-1.5">
                                    {['aadhaar', 'pan', 'police', 'bank'].map((key) => {
                                        const status = worker.verification[key as keyof typeof worker.verification];
                                        const color = status === 'VERIFIED' ? 'bg-emerald-500' : status === 'FAILED' ? 'bg-red-500' : 'bg-slate-200';
                                        return (
                                            <div key={key} className={`w-6 h-1.5 rounded-sm ${color}`} title={`${key}: ${status}`}></div>
                                        );
                                    })}
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <span className={`text-sm font-mono ${verified ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>{progress}%</span>
                            </td>
                            <td className="px-6 py-3">
                                {summaryBadge}
                            </td>
                            <td className="px-6 py-3 text-right">
                                {isOnboarded ? (
                                    <span className="text-xs text-slate-400 font-medium">Completed</span>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedWorker(worker)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {progress === 100 ? 'Review' : 'Verify'} <ChevronRight size={14} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
       </div>
      </div>

      {/* Sticky Onboarding Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg flex items-center justify-between z-10">
         <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{selectedIds.size}</span> employees selected
            </span>
            <button 
                onClick={selectAllVerified}
                className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2"
            >
                <CheckSquare size={16} /> Select All Validated
            </button>
         </div>
         <button 
            onClick={handleOnboard}
            disabled={selectedIds.size === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
         >
            <UserPlus size={18} /> Onboard Selected
         </button>
      </div>
    </div>
  );
};

export default EmployeeList;
