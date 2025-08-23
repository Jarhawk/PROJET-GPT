import { render, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { useState } from 'react';
import FactureLigne from '@/components/FactureLigne';

const renderLine = (value = {}, onChange = vi.fn()) =>
  render(
    <FactureLigne
      value={value}
      onChange={onChange}
      onRemove={() => {}}
      zones={[]}
      index={0}
    />
  );

test('typing 12,5 in qty keeps display and numeric value', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine({}, onChange);
  const input = getByPlaceholderText('0');
  fireEvent.change(input, { target: { value: '12,5' } });
  expect(input.value).toBe('12,5');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ quantite: 12.5 })
  );
});

test('typing 1000 in total HT formats to currency', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine({}, onChange);
  const input = getByPlaceholderText('0,00 €');
  fireEvent.change(input, { target: { value: '1000' } });
  fireEvent.blur(input);
  expect(input.value).toBe('1 000,00 €');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ total_ht: 1000 })
  );
});

test('pasting formatted currency parses numeric value', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine({}, onChange);
  const input = getByPlaceholderText('0,00 €');
  fireEvent.change(input, { target: { value: '1 234,56 €' } });
  fireEvent.blur(input);
  expect(input.value).toBe('1 234,56 €');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ total_ht: 1234.56 })
  );
});

test('PriceDelta reacts to PU HT vs PMP', () => {
  const Wrapper = () => {
    const [value, setValue] = useState({
      quantite: 1,
      total_ht: 1.73,
      pmp: 1.73,
    });
    return (
      <FactureLigne
        value={value}
        onChange={setValue}
        onRemove={() => {}}
        zones={[]}
        index={0}
      />
    );
  };
  const { getByLabelText, getByPlaceholderText } = render(<Wrapper />);
  const input = getByPlaceholderText('0,00 €');
  expect(getByLabelText(/égal/)).toBeTruthy();
  fireEvent.change(input, { target: { value: '1,90' } });
  fireEvent.blur(input);
  expect(getByLabelText(/supérieur/)).toBeTruthy();
  fireEvent.change(input, { target: { value: '1,50' } });
  fireEvent.blur(input);
  expect(getByLabelText(/inférieur/)).toBeTruthy();
  fireEvent.change(input, { target: { value: '1,73' } });
  fireEvent.blur(input);
  expect(getByLabelText(/égal/)).toBeTruthy();
});
