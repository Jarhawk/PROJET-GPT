import { useNavigate, useParams } from "react-router-dom";
import InventaireForm from "@/components/inventaires/InventaireForm";

export default function InventaireFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="p-4">
      <InventaireForm
        inventaireId={id}
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
