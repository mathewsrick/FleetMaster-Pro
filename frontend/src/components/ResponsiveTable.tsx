import React from 'react';

interface Column {
  key: string;
  label: string;
  mobileLabel?: string; // Label corto para móvil
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
  hideOnMobile?: boolean; // Ocultar en móvil
  mobileOrder?: number; // Orden en vista móvil (0 = principal)
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  mobileCardRender?: (row: any, columns: Column[]) => React.ReactNode; // Render personalizado para móvil
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  mobileCardRender
}) => {
  // Vista Desktop (tabla tradicional)
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-12 text-center text-indigo-600">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-12 text-center text-slate-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-slate-50 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 lg:px-6 py-3 lg:py-4 ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Vista Móvil (cards)
  const MobileView = () => {
    if (loading && data.length === 0) {
      return (
        <div className="md:hidden p-12 text-center text-indigo-600">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="md:hidden p-12 text-center text-slate-400 font-medium text-sm">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="md:hidden space-y-3 p-3">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick?.(row)}
            className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${onRowClick ? 'active:scale-[0.98]' : ''} transition-all`}
          >
            {mobileCardRender ? (
              mobileCardRender(row, columns)
            ) : (
              <DefaultMobileCard row={row} columns={columns} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <DesktopView />
      <MobileView />
    </>
  );
};

// Card móvil por defecto
const DefaultMobileCard: React.FC<{ row: any; columns: Column[] }> = ({ row, columns }) => {
  // Ordenar columnas por mobileOrder
  const sortedColumns = [...columns]
    .filter(col => !col.hideOnMobile)
    .sort((a, b) => (a.mobileOrder ?? 999) - (b.mobileOrder ?? 999));

  const primaryColumn = sortedColumns[0];
  const otherColumns = sortedColumns.slice(1);

  return (
    <div className="space-y-2">
      {/* Columna principal */}
      {primaryColumn && (
        <div className="pb-2 border-b border-slate-100">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {primaryColumn.mobileLabel || primaryColumn.label}
          </div>
          <div className="text-sm font-bold text-slate-900">
            {primaryColumn.render ? primaryColumn.render(row[primaryColumn.key], row) : row[primaryColumn.key]}
          </div>
        </div>
      )}

      {/* Otras columnas */}
      <div className="space-y-2">
        {otherColumns.map((col) => (
          <div key={col.key} className="flex justify-between items-start gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
              {col.mobileLabel || col.label}
            </span>
            <div className="text-xs font-medium text-slate-700 text-right">
              {col.render ? col.render(row[col.key], row) : row[col.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
