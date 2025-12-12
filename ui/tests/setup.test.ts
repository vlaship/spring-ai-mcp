import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Testing Framework Setup', () => {
  it('should have Vitest working', () => {
    expect(true).toBe(true);
  });

  it('should have Fast-Check working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      })
    );
  });

  it('should have Happy-DOM working', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
  });

  it('should have MSW server available', () => {
    expect(globalThis.testServer).toBeDefined();
  });
});