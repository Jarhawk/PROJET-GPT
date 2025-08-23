import { render, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import FactureLigne from '@/components/FactureLigne';

const renderLine = (onChange = vi.fn()) =>
  render(<FactureLigne value={{}} onChange={onChange} onRemove={() => {}} zones={[]} index={0} />);

test('typing 1,5 in qty keeps display and numeric value', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine(onChange);
  const input = getByPlaceholderText('0');
  fireEvent.input(input, { target: { value: '1,5' } });
  expect(input.value).toBe('1,5');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ quantite: 1.5 })
  );
});

test('total HT 1234,5 formats to currency', () => {
  const onChange = vi.fn();
  const { getByPlaceholderText } = renderLine(onChange);
  const input = getByPlaceholderText('0,00 €');
  fireEvent.input(input, { target: { value: '1234,5' } });
  fireEvent.blur(input);
  expect(input.value).toBe('1 234,50 €');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ total_ht: 1234.5 })
  );
});
