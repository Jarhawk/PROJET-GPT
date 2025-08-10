// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from "@testing-library/react";
import ZoneForm from "@/forms/ZoneForm.jsx";
import UniteForm from "@/forms/UniteForm.jsx";
import PeriodeForm from "@/forms/PeriodeForm.jsx";

function expectFormAccessible(ui) {
  const { container } = render(ui);
  screen.queryAllByRole("textbox").forEach(input => {
    expect(input).toHaveAccessibleName();
  });
  const form = container.querySelector("form");
  expect(form).toHaveClass("max-w-3xl");
  expect(form.querySelector(".grid")).not.toBeNull();
}

test("ZoneForm layout is accessible", () => {
  expectFormAccessible(<ZoneForm onSave={() => {}} onCancel={() => {}} />);
});

test("UniteForm layout is accessible", () => {
  expectFormAccessible(<UniteForm onSave={() => {}} onCancel={() => {}} />);
});

test("PeriodeForm layout is accessible", () => {
  expectFormAccessible(<PeriodeForm onSave={() => {}} onCancel={() => {}} />);
});

