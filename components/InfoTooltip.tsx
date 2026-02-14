
import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  return (
    <div className="group relative inline-block ml-1 align-middle">
      <Info className="w-4 h-4 text-slate-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};
