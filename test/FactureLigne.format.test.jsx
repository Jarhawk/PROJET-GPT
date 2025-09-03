import { render, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FactureLigne from '@/components/FactureLigne';

const renderLine = (value = {}, onChange = vi.fn()) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <FactureLigne
        value={value}
        onChange={onChange}
        onRemove={() => {}}
        zones={[]}
        index={0}
      />
    </QueryClientProvider>
  );
};

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
  const qc = new QueryClient();
  const { container, rerender } = render(
    <QueryClientProvider client={qc}>
      <FactureLigne
        value={{ quantite: 1, total_ht: 1.8, pmp: 2 }}
        onChange={() => {}}
        onRemove={() => {}}
        zones={[]}
        index={0}
      />
    </QueryClientProvider>
  );
  let badge = container.querySelector('[aria-label="Écart vs PMP"]');
  expect(badge?.textContent).toBe('-10,00%');
  expect(badge?.classList.contains('bg-green-500')).toBe(true);

  rerender(
    <QueryClientProvider client={qc}>
      <FactureLigne
        value={{ quantite: 1, total_ht: 2.3, pmp: 2 }}
        onChange={() => {}}
        onRemove={() => {}}
        zones={[]}
        index={0}
      />
    </QueryClientProvider>
  );
  badge = container.querySelector('[aria-label="Écart vs PMP"]');
  expect(badge?.textContent).toBe('15,00%');
  expect(badge?.classList.contains('bg-red-500')).toBe(true);

  rerender(
    <QueryClientProvider client={qc}>
      <FactureLigne
        value={{ quantite: 1, total_ht: 2.3, pmp: 0 }}
        onChange={() => {}}
        onRemove={() => {}}
        zones={[]}
        index={0}
      />
    </QueryClientProvider>
  );
  badge = container.querySelector('[aria-label="Écart vs PMP"]');
  expect(badge?.textContent).toBe('—');
  expect(badge?.classList.contains('bg-white/20')).toBe(true);
});
