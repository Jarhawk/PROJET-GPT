// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  table: { display: 'table', width: 'auto', marginTop: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', padding: 4 },
  cell: { flex: 1 },
  footer: { marginTop: 20, fontSize: 10, textAlign: 'center' },
})

export default function CostingCartePDF({ fiches = [], settings = {}, mamaName = '' }) {
  const moyenne = (key) => {
    const vals = fiches.map((f) => Number(f[key] || 0)).filter((v) => !isNaN(v))
    if (vals.length === 0) return 0
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }
  const margeMoy = moyenne('marge_pct').toFixed(2)
  const fcMoy = moyenne('food_cost_pct').toFixed(2)
  const sousObjectif = fiches.filter(
    (f) =>
      (settings?.objectif_marge_pct && f.marge_pct < settings.objectif_marge_pct) ||
      (settings?.objectif_food_cost_pct && f.food_cost_pct > settings.objectif_food_cost_pct)
  ).length

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Costing Carte</Text>
        <Text>Marge moyenne % : {margeMoy}</Text>
        <Text>Food cost moyen % : {fcMoy}</Text>
        <Text>Fiches sous objectif : {sousObjectif}</Text>
        <View style={styles.table}>
          {fiches.map((f) => (
            <View key={f.fiche_id} style={styles.row}>
              <Text style={[styles.cell, { flex: 2 }]}>{f.nom}</Text>
              <Text style={styles.cell}>{f.type}</Text>
              <Text style={styles.cell}>{Number(f.cout_par_portion || 0).toFixed(2)}</Text>
              <Text style={styles.cell}>{Number(f.prix_vente || 0).toFixed(2)}</Text>
              <Text style={styles.cell}>{Number(f.marge_euro || 0).toFixed(2)}</Text>
              <Text style={styles.cell}>{Number(f.marge_pct || 0).toFixed(2)}</Text>
              <Text style={styles.cell}>{Number(f.food_cost_pct || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>
          Généré le {new Date().toLocaleDateString()} - {mamaName}
        </Text>
      </Page>
    </Document>
  )
}
