// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import { useRGPD } from "@/hooks/useRGPD";

export default function ExportUserData({ userId = null }) {
  const { user_id, role } = useAuth();
  const { getUserDataExport } = useRGPD();
  const [loading, setLoading] = useState(false);

  const targetId = userId || user_id;
  if (!targetId) return null;
  if (userId && role !== "superadmin") return null;

  const handleExport = async () => {
    setLoading(true);
    const data = await getUserDataExport(targetId);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${targetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export généré");
    setLoading(false);
  };

  return (
    <div className="p-6">
      <Toaster />
      <Button onClick={handleExport} disabled={loading}>
        {loading ? "Export..." : "Exporter mes données"}
      </Button>
    </div>
  );
}
