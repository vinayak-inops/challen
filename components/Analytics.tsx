import React from 'react';
import { Contractor } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface AnalyticsProps {
  contractors: Contractor[];
}

const Analytics: React.FC<AnalyticsProps> = ({ contractors }) => {
  
  // Data prep for "Performance by Contractor"
  const performanceData = contractors.map(c => {
    let totalDays = 0;
    let presentDays = 0;
    c.workers.forEach(w => {
      w.attendance.forEach(a => {
        totalDays++;
        if (a.present) presentDays++;
      });
    });
    const score = totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
    return {
      name: c.name.split(' ')[0], // Short name
      score: score,
      workers: c.workers.length
    };
  });

  // Data prep for "Attendance Trend (Last 30 Days)" - Aggregate
  // We assume all have same dates for simplicity of mock
  const dates = contractors[0]?.workers[0]?.attendance.map(a => a.date) || [];
  const trendData = dates.map(date => {
    let dailyTotal = 0;
    let dailyPresent = 0;
    
    contractors.forEach(c => {
      c.workers.forEach(w => {
        const record = w.attendance.find(a => a.date === date);
        if (record) {
          dailyTotal++;
          if (record.present) dailyPresent++;
        }
      });
    });

    return {
      date: date.split('-').slice(1).join('/'), // MM/DD
      rate: dailyTotal === 0 ? 0 : Math.round((dailyPresent / dailyTotal) * 100)
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Labor Analytics</h2>
        <p className="text-slate-500">Deep dive into attendance trends and contractor efficiency.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Performance Scores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">Contractor Performance Score</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Attendance Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">Overall Attendance Trend (30 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} minTickGap={30} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* Chart 3: Workforce Distribution */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-6">Workforce Volume by Contractor</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} width={100} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="workers" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;