import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import MoneyInputFR from '@/components/forms/MoneyInputFR.jsx';

function Wrapper() {
  const [value, setValue] = useState(0);
  return (
    <>
      <MoneyInputFR
        value={value}
        onChange={setValue}
        data-testid="money"
      />
      <span data-testid="val">{value}</span>
    </>
  );
}

describe('MoneyInputFR', () => {
  it('handles typing and paste', () => {
    render(<Wrapper />);
    const input = screen.getByTestId('money');
    const value = () => Number(screen.getByTestId('val').textContent);

    fireEvent.focus(input);

    fireEvent.change(input, { target: { value: '1', selectionStart: 1 } });
    expect(value()).toBe(1);
    expect(input.value).toBe('1,00 €');

    fireEvent.change(input, { target: { value: '12,5', selectionStart: 5 } });
    expect(value()).toBe(12.5);
    expect(input.value).toBe('12,50 €');

    fireEvent.change(input, {
      target: { value: '1 234,56 €', selectionStart: 12 },
    });
    expect(value()).toBe(1234.56);
    expect(input.value).toBe('1 234,56 €');
  });
});

