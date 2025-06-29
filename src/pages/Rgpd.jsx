// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import Footer from "@/components/Footer";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function Rgpd() {
  return (
    <div className="relative flex flex-col min-h-screen text-white overflow-hidden">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <div className="flex-grow flex flex-col items-center px-4 py-16 relative z-10">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <GlassCard className="space-y-6 text-white">
            <h1 className="text-3xl font-bold text-center">Données &amp; Confidentialité</h1>
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="leading-relaxed">
                MamaStock attache une grande importance à la protection de vos données personnelles.
              </p>
            </Motion.section>
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <h2 className="text-xl font-semibold">Traitement des données</h2>
              <p>
                Les données collectées (emails, identifiants, informations de gestion F&amp;B) servent uniquement à
                faire fonctionner l’application, à améliorer votre expérience et à sécuriser l’accès.
              </p>
            </Motion.section>
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-2"
            >
              <h2 className="text-xl font-semibold">Confidentialité</h2>
              <p>
                Les données ne sont ni vendues, ni partagées à des tiers extérieurs à l’application. Seules les personnes
                autorisées au sein de votre établissement y ont accès.
              </p>
            </Motion.section>
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-xl font-semibold">Droits des utilisateurs</h2>
              <p>
                À tout moment, vous pouvez demander la consultation, la modification ou la suppression de vos données en
                contactant votre administrateur ou l’équipe MamaStock.
              </p>
              <p>
                Pour toute question&nbsp;:
                {' '}
                <a href="mailto:support@mamastock.com" className="underline text-mamastockGold">support@mamastock.com</a>
              </p>
            </Motion.section>
            <div className="text-center pt-2">
              <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/"
                  className="inline-block px-6 py-2 rounded-xl bg-glass border border-borderGlass hover:bg-white/20 transition backdrop-blur"
                >
                  Retour à l’accueil
                </Link>
              </Motion.div>
            </div>
          </GlassCard>
        </Motion.div>
      </div>
      <Footer />
    </div>
  );
}
