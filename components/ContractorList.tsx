import React, { useState } from 'react';
import { Contractor, ComplianceStatus } from '../types';
import { FileText, MoreHorizontal, Sparkles, Search, Table2, LayoutList, Briefcase, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { generateComplianceReport } from '../services/geminiService';
import RichTextRenderer from './RichTextRenderer';

interface ContractorListProps {
  contractors: Contractor[];
}

type ViewMode = 'directory' | 'statutory' | 'workorders';

const ContractorList: React.FC<ContractorListProps> = ({ contractors }) => {
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [expandedWorkOrderId, setExpandedWorkOrderId] = useState<string | null>(null);

  const calculatePerformanceScore = (contractor: Contractor): number => {
    if (contractor.workers.length === 0) return 0;
    let totalDays = 0;
    let presentDays = 0;
    contractor.workers.forEach(w => {
      w.attendance.forEach(a => {
        totalDays++;
        if (a.present) presentDays++;
      });
    });
    return totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
  };

  const handleGenerateReport = async (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsGenerating(true);
    setAiReport(null);
    const dataForAI = JSON.stringify({
      name: contractor.name,
      license: contractor.licenseNumber,
      expiry: contractor.licenseExpiryDate,
      workerCount: contractor.workers.length,
      workOrders: contractor.workOrders.length,
      performanceScore: calculatePerformanceScore(contractor),
      specialization: contractor.specialization,
      complianceStatus: contractor.status
    });
    const report = await generateComplianceReport(dataForAI);
    setAiReport(report);
    setIsGenerating(false);
  };

  const filteredContractors = contractors.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleWorkOrderExpand = (woId: string) => {
    setExpandedWorkOrderId(expandedWorkOrderId === woId ? null : woId);
  };

  // Google Console Style Table Header
  const TableHeader = ({ children }: { children: React.ReactNode }) => (
     <th className="px-6 py-3 border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        {children}
     </th>
  );

  const renderStatutoryView = () => (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col h-full">
       <div className="overflow-auto flex-1">
         <table className="w-full text-left border-collapse">
           <thead>
             <tr>
               <TableHeader>Sl. No.</TableHeader>
               <TableHeader>Contractor Details</TableHeader>
               <TableHeader>Nature of Work</TableHeader>
               <TableHeader>Location</TableHeader>
               <TableHeader>Period (From - To)</TableHeader>
               <TableHeader>Workers</TableHeader>
               <TableHeader>License Status</TableHeader>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 bg-white">
             {filteredContractors.map((contractor, index) => {
               const isExpired = new Date(contractor.licenseExpiryDate) < new Date();
               return (
                 <tr key={contractor.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-3 text-sm text-slate-500">{index + 1}</td>
                   <td className="px-6 py-3 text-sm font-medium text-slate-800">
                     {contractor.name}
                     <div className="text-xs text-slate-500 font-normal">{contractor.email}</div>
                   </td>
                   <td className="px-6 py-3 text-sm text-slate-600">{contractor.specialization}</td>
                   <td className="px-6 py-3 text-sm text-slate-600">{contractor.location}</td>
                   <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {contractor.contractStartDate} <span className="text-slate-400 mx-1">/</span> {contractor.licenseExpiryDate}
                   </td>
                   <td className="px-6 py-3 text-sm text-slate-800 text-center font-medium">{contractor.workers.length}</td>
                   <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                         isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                   </td>
                 </tr>
               );
             })}
           </tbody>
         </table>
       </div>
    </div>
  );

  const renderWorkOrdersView = () => {
    const allWorkOrders = filteredContractors.flatMap(c => c.workOrders.map(wo => ({ ...wo, contractorName: c.name, contractorId: c.id, workers: c.workers })));
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col h-full">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <TableHeader>WO Number</TableHeader>
                <TableHeader>Contractor</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Validity</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Staff</TableHeader>
                <TableHeader>Status</TableHeader>
                <th className="px-6 py-3 border-b border-slate-200 bg-slate-50 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {allWorkOrders.map((wo) => {
                const assignedWorkers = wo.workers.filter(w => w.workOrderId === wo.id);
                const isExpanded = expandedWorkOrderId === wo.id;
                return (
                  <React.Fragment key={wo.id}>
                    <tr className={`hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${isExpanded ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'}`} onClick={() => toggleWorkOrderExpand(wo.id)}>
                      <td className="px-6 py-3 text-sm font-mono text-slate-600">{wo.workOrderNumber}</td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-800">{wo.contractorName}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-xs">{wo.description}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{wo.validTo}</td>
                      <td className="px-6 py-3 text-sm text-slate-800 font-mono">₹{(wo.contractValue / 100000).toFixed(2)}L</td>
                      <td className="px-6 py-3 text-center text-sm">{assignedWorkers.length}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          wo.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {wo.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="px-6 py-4 border-b border-slate-200">
                          <div className="pl-4 border-l-2 border-slate-300">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                               <Users size={14} /> Assigned Employees
                             </h4>
                             {assignedWorkers.length > 0 ? (
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                 {assignedWorkers.map(worker => (
                                   <div key={worker.id} className="bg-white p-3 rounded border border-slate-200 flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                       {worker.name.charAt(0)}
                                     </div>
                                     <div>
                                       <p className="text-sm font-medium text-slate-800">{worker.name}</p>
                                       <p className="text-xs text-slate-500">{worker.id}</p>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <p className="text-sm text-slate-500 italic">No employees assigned.</p>
                             )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDirectoryView = () => (
    <div className="flex gap-6 flex-1 min-h-0">
      <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <TableHeader>Contractor</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Work Orders</TableHeader>
                <TableHeader>Workforce</TableHeader>
                <TableHeader>Perf. Score</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredContractors.map((contractor) => {
                const score = calculatePerformanceScore(contractor);
                return (
                  <tr key={contractor.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-slate-800">{contractor.name}</div>
                      <div className="text-xs text-slate-500">{contractor.specialization}</div>
                    </td>
                    <td className="px-6 py-3">
                       <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                          contractor.status === ComplianceStatus.COMPLIANT ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          contractor.status === ComplianceStatus.NON_COMPLIANT ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {contractor.status}
                        </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{contractor.workOrders.length}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{contractor.workers.length}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${score}%`}}></div>
                        </div>
                        <span className="text-xs font-mono">{score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <button 
                        onClick={() => handleGenerateReport(contractor)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Sparkles size={14} /> Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Report Drawer (Right Side) */}
      {selectedContractor && (
        <div className="w-[400px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-20 absolute right-0 top-16 bottom-0">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-medium text-slate-800">Compliance Audit</h3>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{selectedContractor.name}</p>
            </div>
            <button onClick={() => setSelectedContractor(null)} className="text-slate-500 hover:text-slate-800">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm text-slate-600">Analyzing data...</p>
              </div>
            ) : aiReport ? (
              <RichTextRenderer content={aiReport} />
            ) : (
              <div className="text-center text-slate-400 mt-10">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select a contractor to generate a report.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-normal text-slate-800">Contractors</h1>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-white border border-slate-300 rounded-md overflow-hidden p-0.5 shadow-sm">
             <button onClick={() => setViewMode('directory')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${viewMode === 'directory' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                <LayoutList size={16} /> List
             </button>
             <button onClick={() => setViewMode('workorders')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${viewMode === 'workorders' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Briefcase size={16} /> Work Orders
             </button>
             <button onClick={() => setViewMode('statutory')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${viewMode === 'statutory' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Table2 size={16} /> Statutory
             </button>
           </div>
           
           <div className="relative">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Filter..." 
               className="pl-9 pr-4 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm w-48 shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
      </div>

      {viewMode === 'directory' && renderDirectoryView()}
      {viewMode === 'workorders' && renderWorkOrdersView()}
      {viewMode === 'statutory' && renderStatutoryView()}
    </div>
  );
};

export default ContractorList;