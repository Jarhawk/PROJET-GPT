import { describe, it, expect } from 'vitest';
import { shouldShowHelp } from '../scripts/cli_utils.js';

describe('shouldShowHelp', () => {
  it('detects help flags anywhere', () => {
    expect(shouldShowHelp(['--help'])).toBe(true);
    expect(shouldShowHelp(['foo', '--help', 'bar'])).toBe(true);
    expect(shouldShowHelp(['-h'])).toBe(true);
    expect(shouldShowHelp(['foo', '-h'])).toBe(true);
  });

  it('returns false when no flag present', () => {
    expect(shouldShowHelp(['foo'])).toBe(false);
  });
});
