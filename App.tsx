
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContractorList from './components/ContractorList';
import Analytics from './components/Analytics';
import ComplianceAssistant from './components/ComplianceAssistant';
import IdentityVerification from './components/IdentityVerification';
import EmployeeList from './components/EmployeeList';
import ChallanReconciliation from './components/ChallanReconciliation';
import { fetchCLMSData } from './services/mongoService';
import { Contractor, Worker } from './types';
import { Loader2, Database, Search, Bell, Settings, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  // Removed isAuthenticated state
  const [activeTab, setActiveTab] = useState('compliance');
  const [data, setData] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetches data immediately on mount
    const initData = async () => {
      try {
        const fetchedData = await fetchCLMSData();
        setData(fetchedData);
        setLoading(false);
      } catch (err) {
        setError("Failed to connect to DB");
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleUpdateWorkers = (updatedWorker: Worker) => {
      setData(prevData => prevData.map(contractor => {
          if (contractor.id === updatedWorker.contractorId) {
              return {
                  ...contractor,
                  workers: contractor.workers.map(w => w.id === updatedWorker.id ? updatedWorker : w)
              };
          }
          return contractor;
      }));
  };

  const allWorkers = data.flatMap(c => c.workers);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-fade-in">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <div className="text-center">
            <h2 className="text-lg font-medium text-slate-800">Connecting to Database...</h2>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-600">
          <Database size={48} className="mb-4 opacity-50" />
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    switch (activeTab) {
      // case 'dashboard': return <Dashboard contractors={data} />;
      // case 'contractors': return <ContractorList contractors={data} />;
      // case 'employees': return <EmployeeList workers={allWorkers} onUpdateWorkers={handleUpdateWorkers} />;
      
      // case 'reconciliation': return <ChallanReconciliation contractors={data} />;
      // case 'verification': return <IdentityVerification />;
      // case 'compliance': return <ComplianceAssistant contractors={data} />;
      // case 'analytics': return <Analytics contractors={data} />;
      default: return <ChallanReconciliation contractors={data} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Google Console Style App Bar */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          {/* Search Box */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-blue-600" />
              </div>
              <input 
                type="text"
                placeholder="Search resources, docs, products..."
                className="w-full bg-slate-100 hover:bg-white focus:bg-white text-slate-700 text-sm rounded-md border border-transparent focus:border-blue-500 hover:border-slate-300 hover:shadow-sm focus:ring-0 pl-10 pr-4 py-2 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-6">
            <button className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><HelpCircle size={20} /></button>
            <button className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><Bell size={20} /></button>
            <button className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><Settings size={20} /></button>
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-indigo-600">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
