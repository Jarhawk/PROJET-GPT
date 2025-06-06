import SimulationForm from "./SimulationForm";
import SimulationResult from "./SimulationResult";
import { useSimulation } from "@/hooks/useSimulation";

export default function SimulationMenu() {
  const { selection, results, addRecipe, setPrix } = useSimulation();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simulation de menu</h2>
      <SimulationForm addRecipe={addRecipe} setPrix={setPrix} />
      <div className="mt-6">
        <SimulationResult selection={selection} results={results} />
      </div>
    </div>
  );
}