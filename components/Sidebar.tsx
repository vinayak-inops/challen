
import React, { useState } from 'react';
import { LayoutDashboard, Users, BarChart3, BrainCircuit, ShieldCheck, UserCheck, ChevronLeft, ChevronRight, Activity, Menu, FileSpreadsheet } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    // { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    // { id: 'contractors', label: 'Contractors', icon: Users },
    // { id: 'employees', label: 'Employees', icon: UserCheck },
    // { id: 'compliance', label: 'Compliance AI', icon: BrainCircuit },
    { id: 'reconciliation', label: 'Reconciliation', icon: FileSpreadsheet },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    // { id: 'verification', label: 'Verification', icon: ShieldCheck },
  ];

  return (
    <div 
      className={`bg-white border-r border-slate-200 h-screen flex flex-col z-20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[60px]' : 'w-[256px]'
      }`}
    >
      {/* Header Area */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="text-slate-500 hover:bg-slate-100 p-1 rounded-full transition-colors shrink-0"
          >
             <Menu size={20} />
          </button>
          
          <img 
            src="https://iddion.com/wp-content/themes/InOps_Tech/assets/img/logo.jpeg" 
            alt="Logo" 
            className={`w-8 h-8 object-contain transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
          />
          
          {!isCollapsed && (
             <a href={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`} className="font-medium text-lg text-slate-700 whitespace-nowrap">CLMS Console</a>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center h-10 px-4 mb-1 transition-colors relative group ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-500'} ${isCollapsed ? 'mx-auto' : 'mr-4'}`} />
              
              {!isCollapsed && (
                <span className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-blue-700' : ''}`}>
                  {item.label}
                </span>
              )}

              {/* Google Style Active Indicator (Left Border) */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600 rounded-r"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="border-t border-slate-200 p-2">
         {!isCollapsed ? (
            <div className="px-3 py-2">
                {/* <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[11px] font-mono text-slate-500">122.166.245.97</span>
                </div> */}
                <div className="flex items-center gap-2 text-blue-700 text-xs font-medium">
                    <Activity size={14} /> AI Services Online
                </div>
            </div>
         ) : (
            <div className="flex justify-center py-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected"></div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Sidebar;
