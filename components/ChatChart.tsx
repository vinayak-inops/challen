
import React from 'react';
import { ChartConfig } from '../types';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

interface ChatChartProps {
  config: ChartConfig;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ChatChart: React.FC<ChatChartProps> = ({ config }) => {
  const { type, title, data, xAxisKey, dataKeys } = config;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip 
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              cursor={{fill: '#f8fafc'}}
            />
            <Legend />
            {dataKeys.map((dk, i) => (
              <Bar 
                key={dk.key} 
                dataKey={dk.key} 
                name={dk.name || dk.key} 
                fill={dk.color || COLORS[i % COLORS.length]} 
                radius={[4, 4, 0, 0]} 
              />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip 
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Legend />
            {dataKeys.map((dk, i) => (
              <Line 
                key={dk.key} 
                type="monotone" 
                dataKey={dk.key} 
                name={dk.name || dk.key} 
                stroke={dk.color || COLORS[i % COLORS.length]} 
                strokeWidth={3}
                dot={{r: 4}}
              />
            ))}
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={dataKeys[0].key}
              nameKey={xAxisKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Legend />
          </PieChart>
        );
      default:
        return <div className="text-red-500 text-sm">Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full my-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-700 mb-4 text-center uppercase tracking-wide">{title}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChatChart;
