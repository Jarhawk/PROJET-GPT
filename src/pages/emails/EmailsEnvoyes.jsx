// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmailsEnvoyes } from '@/hooks/useEmailsEnvoyes';
import { useAuth } from '@/hooks/useAuth';
import { useCommandes } from '@/hooks/useCommandes';
import TableContainer from '@/components/ui/TableContainer';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PaginationFooter from '@/components/ui/PaginationFooter';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import CommandePDF from '@/components/pdf/CommandePDF';

import { toast } from 'sonner';

export default function EmailsEnvoyes() {
  const { mama_id, loading: authLoading, role } = useAuth();
  const { emails, fetchEmails, loading, error, resendEmail } =
  useEmailsEnvoyes();
  const { fetchCommandeById } = useCommandes();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statut, setStatut] = useState('');
  const [email, setEmail] = useState('');
  const [commande, setCommande] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (!authLoading && mama_id) load();
  }, [authLoading, mama_id, page]);

  async function load() {
    const { count } = await fetchEmails({
      statut: statut || undefined,
      email: email || undefined,
      commande_id: commande || undefined,
      date_start: start || undefined,
      date_end: end || undefined,
      page
    });
    setPages(Math.max(1, Math.ceil((count || 0) / 50)));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const exportExcel = () => {
    const rows = emails.map((e) => ({
      envoye_le: e.envoye_le,
      email: e.email,
      commande: e.commandes?.reference || e.commande_id,
      statut: e.statut
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Emails');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'emails-envoyes.xlsx');
  };

  const handleViewPDF = async (commandeId) => {
    try {
      const { data: commande } = await fetchCommandeById(commandeId);
      if (!commande) throw new Error();
      const { data: tpl } = await supabase.
      rpc('get_template_commande', {
        p_mama: mama_id,
        p_fournisseur: commande.fournisseur_id
      }).
      single();
      const template = tpl || null;
      const blob = await pdf(
        <CommandePDF
          commande={commande}
          template={template}
          fournisseur={commande.fournisseur} />

      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleResend = async (id) => {
    const { error: err } = await resendEmail(id);
    if (err) {
      toast.error("Erreur lors de l'envoi");
    } else {
      toast.success('Email renvoyé avec succès');
      await load();
    }
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-6 space-y-4 container mx-auto text-sm">
      <h1 className="text-2xl font-bold">Emails envoyés</h1>
      <GlassCard title="Filtrer" className="mb-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap gap-2 items-end">

          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="border rounded px-2 py-1 text-black">

            <option value="">Tous</option>
            <option value="success">Succès</option>
            <option value="error">Erreur</option>
          </select>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-40" />

          <Input
            placeholder="Commande"
            value={commande}
            onChange={(e) => setCommande(e.target.value)}
            className="w-32" />

          <Input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)} />

          <Input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)} />

          <Button type="submit" className="text-sm">
            Filtrer
          </Button>
          <Button type="button" className="text-sm" onClick={exportExcel}>
            Exporter Excel
          </Button>
        </form>
      </GlassCard>

      {loading ?
      <LoadingSpinner message="Chargement..." /> :
      error ?
      <div className="text-red-600">{error.message || error}</div> :

      <>
          <TableContainer>
            <table className="min-w-full text-xs md:table">
              <thead className="hidden md:table-header-group">
                <tr>
                  <th className="px-2 py-1">Date d'envoi</th>
                  <th className="px-2 py-1">Email</th>
                  <th className="px-2 py-1">Commande</th>
                  <th className="px-2 py-1">Statut</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e) =>
              <tr
                key={e.id}
                className="border-b border-white/10 md:table-row block md:border-0 mb-2 md:mb-0">

                    <td className="px-2 py-1 md:border-none block md:table-cell">
                      <span className="md:hidden font-semibold">Date: </span>
                      {new Date(e.envoye_le).toLocaleString()}
                    </td>
                    <td className="px-2 py-1 md:border-none block md:table-cell break-all">
                      <span className="md:hidden font-semibold">Email: </span>
                      {e.email}
                    </td>
                    <td className="px-2 py-1 md:border-none block md:table-cell">
                      <span className="md:hidden font-semibold">
                        Commande:{' '}
                      </span>
                      <Link
                    to={`/commandes/${e.commande_id}`}
                    className="underline text-mamastockGold">

                        {e.commandes?.reference || e.commande_id}
                      </Link>
                    </td>
                    <td className="px-2 py-1 md:border-none block md:table-cell">
                      <span className="md:hidden font-semibold">Statut: </span>
                      <Badge color={e.statut === 'success' ? 'green' : 'red'}>
                        {e.statut === 'success' ? 'Succès' : 'Erreur'}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 md:border-none block md:table-cell space-x-1">
                      <span className="md:hidden font-semibold">Actions: </span>
                      <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPDF(e.commande_id)}>

                        Voir PDF
                      </Button>
                      {role === 'admin' &&
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(e.id)}>

                          Renvoyer
                        </Button>
                  }
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </TableContainer>
          <PaginationFooter
          page={page}
          pages={pages}
          onPageChange={(p) => setPage(p)} />

        </>
      }
    </div>);

}