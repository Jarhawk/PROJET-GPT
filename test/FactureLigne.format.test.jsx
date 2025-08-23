import { render, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
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
  fireEvent.input(input, { target: { value: '12,5' } });
  expect(input.value).toBe('12,5');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ quantite: 12.5 })
  );
});

test('typing 1000 in total HT formats to currency', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine({}, onChange);
  const input = getByPlaceholderText('0,00 €');
  fireEvent.input(input, { target: { value: '1000' } });
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
  fireEvent.input(input, { target: { value: '1 234,56 €' } });
  fireEvent.blur(input);
  expect(input.value).toBe('1 234,56 €');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ total_ht: 1234.56 })
  );
});

test('delta percent vs PMP shows with colors', () => {
  const { container, rerender } = render(
    <FactureLigne
      value={{ quantite: 1, total_ht: 1.8, pmp: 2 }}
      onChange={() => {}}
      onRemove={() => {}}
      zones={[]}
      index={0}
    />
  );
  let badge = container.querySelector('span');
  expect(badge?.textContent).toBe('-10,00 %');
  expect(badge?.classList.contains('text-green-600')).toBe(true);

  rerender(
    <FactureLigne
      value={{ quantite: 1, total_ht: 2.3, pmp: 2 }}
      onChange={() => {}}
      onRemove={() => {}}
      zones={[]}
      index={0}
    />
  );
  badge = container.querySelector('span');
  expect(badge?.textContent).toBe('+15,00 %');
  expect(badge?.classList.contains('text-red-600')).toBe(true);

  rerender(
    <FactureLigne
      value={{ quantite: 1, total_ht: 2.3, pmp: 0 }}
      onChange={() => {}}
      onRemove={() => {}}
      zones={[]}
      index={0}
    />
  );
  badge = container.querySelector('span');
  expect(badge).toBeNull();
});
