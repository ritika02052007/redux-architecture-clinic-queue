import { afterEach, expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
afterEach(() => { cleanup(); localStorage.clear(); });
expect.extend(matchers);
