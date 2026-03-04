import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
}));

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return children;
    },
  };
});
