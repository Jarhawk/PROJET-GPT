import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AutoCompleteField from '@/components/ui/AutoCompleteField';

describe('AutoCompleteField autocompletion safety', () => {
  it('handles unexpected input when options are null', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <AutoCompleteField label="Test" value={null} onChange={handleChange} options={null} />,
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: 'unexpected' } });

    expect(handleChange).toHaveBeenCalledWith({ id: null, nom: 'unexpected' });
  });

  it('handles cleared input', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <AutoCompleteField label="Test" value="existing" onChange={handleChange} options={null} />,
    );

    const input = getByRole('combobox');
    fireEvent.change(input, { target: { value: '' } });

    expect(handleChange).toHaveBeenCalledWith({ id: '', nom: '' });
  });
});

