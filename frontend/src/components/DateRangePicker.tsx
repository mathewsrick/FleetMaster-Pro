import React from 'react';
import DateInput from './DateInput';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, className }) => {
  // Para mobile: abrir ambos pickers en stack, para desktop: inline
  return (
    <div className={`flex flex-col sm:flex-row gap-0 sm:gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-full sm:w-auto ${className || ''}`}>
      <div className="flex flex-row sm:flex-col w-full sm:w-auto">
        <div className="flex items-center sm:py-2 px-3 bg-slate-50 text-slate-400 text-[10px] font-black tracking-widest uppercase min-w-[60px]">Desde</div>
        <DateInput
          value={startDate}
          onChange={d => onChange({ startDate: d, endDate })}
          className="px-3 py-2 text-xs font-bold outline-none flex-1 min-w-[120px] sm:min-w-[120px]"
          placeholder="dd/mm/yyyy"
        />
      </div>
      <div className="flex flex-row sm:flex-col w-full sm:w-auto border-t sm:border-t-0 sm:border-x border-slate-200">
        <div className="flex items-center sm:py-2 px-3 bg-slate-50 text-slate-400 text-[10px] font-black tracking-widest uppercase min-w-[60px]">Hasta</div>
        <DateInput
          value={endDate}
          onChange={d => onChange({ startDate, endDate: d })}
          className="px-3 py-2 text-xs font-bold outline-none flex-1 min-w-[120px] sm:min-w-[120px]"
          placeholder="dd/mm/yyyy"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
