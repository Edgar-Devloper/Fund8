import React from 'react';

/**
 * DataTable reutilizable (simple)
 * Props:
 *  - columns: Array<{ key: string, label: string, render?: (row) => ReactNode, className?:string }>
 *  - data: any[]
 *  - emptyMessage?: string
 *  - dense?: boolean
 *  - striped?: boolean
 */
const DataTable = ({ columns, data, emptyMessage = 'Sin datos', dense = true, striped = true }) => {
  return (
    <div className="table-responsive">
      <table className={`table mb-0 ${dense ? 'table-sm' : ''} ${striped ? 'table-striped' : ''}`}>
        <thead className="table-light">
          <tr>
            {columns.map(col => <th key={col.key} className={col.className || ''}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center text-muted small py-4">{emptyMessage}</td></tr>
          )}
          {data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map(col => (
                <td key={col.key} className={col.className || ''}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
