// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export/exportHelpers';

export default function ExportButtons({ data = [], filename = 'export', disabled = false }) {
  const run = async (format) => {
    const name = `${filename}.${format === 'excel' ? 'xlsx' : format}`;
    if (format === 'csv') await exportToCSV(data, { filename: name });
    else if (format === 'excel') await exportToExcel(data, { filename: name });
    else if (format === 'pdf') await exportToPDF(data, { filename: name });
  };
  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" onClick={() => run('csv')} disabled={disabled}>
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => run('excel')} disabled={disabled}>
        Export Excel
      </Button>
      <Button variant="outline" onClick={() => run('pdf')} disabled={disabled}>
        Export PDF
      </Button>
    </div>
  );
}
