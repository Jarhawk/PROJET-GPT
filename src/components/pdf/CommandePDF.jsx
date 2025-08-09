// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11 },
  section: { marginBottom: 10 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: "bold" },
  ligne: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  logo: { width: 80, height: 40, marginBottom: 10 },
});

export default function CommandePDF({ commande, template, fournisseur }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {template?.logo_url && <Image src={template.logo_url} style={styles.logo} />}
        {template?.entete && (
          <View style={styles.section}>
            <Text>{template.entete}</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.title}>Commande Fournisseur</Text>
          {template?.champs_visibles?.ref_commande && (
            <Text>Réf : {commande.reference}</Text>
          )}
          {template?.champs_visibles?.date_livraison && commande.date_livraison_prevue && (
            <Text>Date livraison : {commande.date_livraison_prevue}</Text>
          )}
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
            {template.contact_nom && <Text>Contact: {template.contact_nom}</Text>}
            {template.contact_tel && <Text>Téléphone: {template.contact_tel}</Text>}
            {template.contact_email && <Text>Email: {template.contact_email}</Text>}
          </View>
        )}

        {template?.pied_page && (
          <View style={styles.section}>
            <Text>{template.pied_page}</Text>
          </View>
        )}

        {template?.conditions_generales && (
          <View style={styles.section}>
            <Text>{template.conditions_generales}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

