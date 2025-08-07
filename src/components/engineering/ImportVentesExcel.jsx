// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'

export default function ImportVentesExcel({ onImport }) {
  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)
    onImport(rows)
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([{ fiche_id: '', ventes: 0 }])
    XLSX.utils.book_append_sheet(wb, ws, 'ventes')
    XLSX.writeFile(wb, 'ventes_template.xlsx')
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={downloadTemplate}>Template</Button>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
    </div>
  )
}
