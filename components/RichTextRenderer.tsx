
import React from 'react';
import { ChartConfig } from '../types';
import ChatChart from './ChatChart';

interface RichTextRendererProps {
  content: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  if (!content) return null;

  // Helper to process inline formatting (Bold, Links)
  const renderInline = (text: string) => {
    // Split by bold markers first
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      // Check for links [Title](url) inside non-bold parts
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
         // Simple single link handling per chunk for now
         const before = part.substring(0, linkMatch.index);
         const after = part.substring((linkMatch.index || 0) + linkMatch[0].length);
         return (
           <React.Fragment key={index}>
             {before}
             <a 
               href={linkMatch[2]} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="text-blue-600 hover:underline font-medium"
             >
               {linkMatch[1]}
             </a>
             {after}
           </React.Fragment>
         );
      }
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  
  let tableBuffer: string[] = [];
  let inTable = false;

  let chartBuffer: string[] = [];
  let inChart = false;

  // 1. Helper to render Table
  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length === 0) return null;

    // Parse Header
    const headerLine = tableBuffer[0];
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    
    // Parse Rows (Skip index 1 if it's separator ---)
    const rows = tableBuffer.slice(2).map(line => {
      return line.split('|').map(cell => cell.trim()).filter(c => c !== '');
    });

    return (
      <div key={`table-${keyPrefix}`} className="my-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 uppercase text-xs tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-slate-600">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2. Helper to render Chart
  const flushChart = (keyPrefix: number) => {
    try {
      // Combine buffer and strip markdown code block markers if present inside
      const jsonString = chartBuffer.join('\n').trim();
      const config = JSON.parse(jsonString) as ChartConfig;
      return <ChatChart key={`chart-${keyPrefix}`} config={config} />;
    } catch (e) {
      return (
        <div key={`chart-err-${keyPrefix}`} className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
          Failed to render chart.
        </div>
      );
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // A. Chart Block Detection: ```json-chart ... ```
    if (trimmed.startsWith('```json-chart')) {
      inChart = true;
      return;
    }
    if (inChart && trimmed.startsWith('```')) {
      inChart = false;
      elements.push(flushChart(index));
      chartBuffer = [];
      return;
    }
    if (inChart) {
      chartBuffer.push(line);
      return;
    }

    // B. Table Detection
    if (trimmed.startsWith('|')) {
      if (!inTable) inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      // End of table block detected by non-pipe line
      elements.push(flushTable(index));
      tableBuffer = [];
      inTable = false;
    }

    // C. Standard Headers & Text
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-2 flex items-center gap-2">
          {trimmed.replace('### ', '')}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-bold text-blue-900 mt-8 mb-3 pb-2 border-b border-blue-100">
          {trimmed.replace('## ', '')}
        </h2>
      );
    } 
    else if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={index} className="flex gap-2 mb-1 ml-1 text-slate-700">
          <span className="text-blue-500 font-bold">•</span>
          <span>{renderInline(trimmed.replace('- ', ''))}</span>
        </div>
      );
    } 
    else if (trimmed.includes('Payslip For') || trimmed.includes('Employee Details')) {
      elements.push(
        <div key={index} className="font-mono font-bold text-slate-500 uppercase text-xs tracking-widest mt-4 mb-1 border-b border-dashed border-slate-300 pb-1">
          {trimmed}
        </div>
      );
    }
    else if (trimmed.length > 0) {
      elements.push(
        <p key={index} className="mb-2 text-slate-700 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  // Flush any remaining buffers
  if (inTable) {
    elements.push(flushTable(lines.length));
  }
  // Charts usually end with ``` so typical flush at end not needed unless malformed, 
  // but safe to ignore for now or add similar logic.

  return <div className="rich-text-content text-sm">{elements}</div>;
};

export default RichTextRenderer;
