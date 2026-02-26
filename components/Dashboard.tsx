import React from 'react';
import { Contractor, ComplianceStatus } from '../types';
import { AlertTriangle, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

interface DashboardProps {
  contractors: Contractor[];
}

const Dashboard: React.FC<DashboardProps> = ({ contractors }) => {
  const totalWorkers = contractors.reduce((acc, c) => acc + c.workers.length, 0);
  const compliantCount = contractors.filter(c => c.status === ComplianceStatus.COMPLIANT).length;
  const warningCount = contractors.filter(c => c.status === ComplianceStatus.WARNING || c.status === ComplianceStatus.NON_COMPLIANT).length;

  const expiringSoon = contractors.filter(c => {
    const expiry = new Date(c.licenseExpiryDate);
    const today = new Date();
    const diffTime = Math.abs(expiry.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return expiry < today || diffDays <= 30;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Contract Labour Management Overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Workforce', value: totalWorkers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Fully Compliant', value: compliantCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Compliance Risks', value: warningCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Avg. Attendance', value: '92%', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-medium text-slate-800 mt-2">{stat.value}</p>
            </div>
            <div className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* License Alerts - Material List Style */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
            <h3 className="text-base font-medium text-slate-800">License Expiry Alerts</h3>
            <button className="text-sm text-blue-600 hover:underline font-medium">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringSoon.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No expiring licenses found. Systems operational.</div>
            ) : (
              expiringSoon.map(contractor => {
                const expiry = new Date(contractor.licenseExpiryDate);
                const today = new Date();
                const isExpired = expiry < today;
                return (
                  <div key={contractor.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                       <AlertTriangle size={18} className={isExpired ? 'text-red-500' : 'text-amber-500'} />
                       <div>
                         <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">{contractor.name}</p>
                         <p className="text-xs text-slate-500">License: {contractor.licenseNumber}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                         isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                       }`}>
                         {isExpired ? 'Expired' : 'Expiring Soon'}
                       </span>
                       <p className="text-xs text-slate-400 mt-1">{contractor.licenseExpiryDate}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Action Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <div className="flex-1">
             <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
               <Clock size={24} />
             </div>
             <h3 className="text-lg font-medium text-slate-800 mb-2">Regulatory Intelligence</h3>
             <p className="text-sm text-slate-600 mb-6 leading-relaxed">
               Use the AI Grounding tool to verify recent changes in Indian Labor Law and generate automated compliance audits for your contractors.
             </p>
          </div>
          <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2">
            Run Compliance Check <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;