// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from "@testing-library/react";
import { Form } from "@/components/ui/Form";
import { FormField } from "@/components/ui/FormField";
import { Input, Select, Textarea } from "@/components/ui/controls";

test("Form labels have associated controls", () => {
  render(
    <Form>
      <FormField label="Nom" htmlFor="nom">
        <Input id="nom" />
      </FormField>
      <FormField label="Description" htmlFor="desc">
        <Textarea id="desc" />
      </FormField>
      <FormField label="Unité" htmlFor="unite">
        <Select id="unite">
          <option>kg</option>
        </Select>
      </FormField>
    </Form>
  );
  expect(screen.getByLabelText("Nom")).toBeInTheDocument();
  expect(screen.getByLabelText("Description")).toBeInTheDocument();
  expect(screen.getByLabelText("Unité")).toBeInTheDocument();
});

