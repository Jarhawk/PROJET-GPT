// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { Button } from '@/components/ui/button';

export default function TwoFactorSetup() {
  const {
    secret,
    enabled,
    refresh,
    startSetup,
    finalizeSetup,
    disable,
    verify,
  } = useTwoFactorAuth();
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const handleEnable = () => {
    startSetup();
    setCode('');
    setVerified(false);
  };

  const handleVerify = async () => {
    if (verify(code)) {
      await finalizeSetup();
      setVerified(true);
    } else {
      alert('Code invalide');
    }
  };

  if (!enabled && !secret) {
    return (
      <Button onClick={handleEnable}>Activer la double authentification</Button>
    );
  }

  return (
    <div className="space-y-4">
      {!enabled && secret && (
        <div className="p-4 bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow">
          <p>
            Scannez ce QR code dans votre application d'authentification puis
            entrez le code :
          </p>
          {secret && (
            <QRCode value={`otpauth://totp/MamaStock?secret=${secret}`} />
          )}
          <input
            className="form-input mt-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          <Button onClick={handleVerify}>Vérifier</Button>
        </div>
      )}
      {verified && (
        <div className="text-green-600">Double authentification activée !</div>
      )}
      {enabled && (
        <Button variant="outline" onClick={disable}>
          Désactiver la double authentification
        </Button>
      )}
    </div>
  );
}
