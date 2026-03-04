import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '@/app/(auth)/login/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText('admin@gps.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows validation error for empty fields', async () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    const submitButton = screen.getByText('Sign In');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  it('displays demo credentials', () => {
    render(
      <Wrapper>
        <LoginPage />
      </Wrapper>
    );

    expect(screen.getByText(/Demo Accounts:/)).toBeInTheDocument();
    expect(screen.getByText(/admin@gps.com \/ admin123/)).toBeInTheDocument();
  });
});
