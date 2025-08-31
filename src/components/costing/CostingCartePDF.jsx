// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  title: { fontSize: 16, marginBottom: 12 },
  kpis: { marginBottom: 12 },
  row: { flexDirection: 'row', borderBottom: '1px solid #ccc', padding: 2 },
  cell: { flex: 1 },
  footer: { position: 'absolute', bottom: 24, left: 24, fontSize: 10 },
})

export default function CostingCartePDF({ data = [], kpis = {}, mamaName = '' }) {
  const rows = Array.isArray(data) ? data : []
  const date = new Date().toLocaleDateString()
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Costing Carte</Text>
        <View style={styles.kpis}>
          <Text>Marge moyenne %: {kpis.marge?.toFixed?.(2) ?? ''}</Text>
          <Text>Food cost moyen %: {kpis.food?.toFixed?.(2) ?? ''}</Text>
          <Text>Fiches sous objectif: {kpis.under ?? 0}</Text>
        </View>
        <View>
          {(() => {
            const lignes = []
            for (let idx = 0; idx < rows.length; idx++) {
              const f = rows[idx]
              lignes.push(
                <View key={idx} style={styles.row}>
                  <Text style={styles.cell}>{f.nom}</Text>
                  <Text style={styles.cell}>{f.type}</Text>
                  <Text style={styles.cell}>{f.cout_par_portion}</Text>
                  <Text style={styles.cell}>{f.prix_vente}</Text>
                  <Text style={styles.cell}>{f.marge_euro}</Text>
                  <Text style={styles.cell}>{f.marge_pct}</Text>
                  <Text style={styles.cell}>{f.food_cost_pct}</Text>
                </View>
              )
            }
            return lignes
          })()}
        </View>
        <Text style={styles.footer}>
          {mamaName} - {date}
        </Text>
      </Page>
    </Document>
  )
}

