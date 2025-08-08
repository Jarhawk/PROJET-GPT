// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  section: { marginBottom: 10 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: "bold" },
  ligne: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
});

export default function CommandePDF({ commande, template, fournisseur }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Commande Fournisseur</Text>
          <Text>Fournisseur : {fournisseur?.nom}</Text>
          <Text>Email : {fournisseur?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Produits</Text>
          {commande.lignes?.map((ligne, idx) => (
            <View key={idx} style={styles.ligne}>
              <Text>{ligne.produit?.nom}</Text>
              <Text>
                {ligne.quantite} {ligne.unite}
              </Text>
              <Text>{Number(ligne.prix_achat || 0).toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {template?.adresse_livraison && (
          <View style={styles.section}>
            <Text style={styles.title}>Adresse de livraison</Text>
            <Text>{template.adresse_livraison}</Text>
          </View>
        )}

        {template?.pied_de_page && (
          <View style={styles.section}>
            <Text>{template.pied_de_page}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

