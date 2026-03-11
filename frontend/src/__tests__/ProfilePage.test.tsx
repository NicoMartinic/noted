/**
 * Integration tests for the Profile page component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ProfilePage from '@/app/profile/page';

// Named function avoids react/display-name lint error
jest.mock('@/components/layout/PrivateLayout', () => {
  function MockPrivateLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
  return MockPrivateLayout;
});

const mockStore = configureStore([]);

const baseState = {
  auth: {
    user: { id: 1, username: 'alice', date_joined: '2024-01-01' },
    isLoading: false,
    error: null,
    fieldErrors: null,
    successMessage: null,
    accessToken: 'tok',
    isInitialized: true,
  },
};

describe('ProfilePage', () => {
  test('renders username', () => {
    render(
      <Provider store={mockStore(baseState)}>
        <ProfilePage />
      </Provider>
    );
    expect(screen.getByText('alice')).toBeTruthy();
  });

  test('shows success banner when successMessage is set', () => {
    const state = { auth: { ...baseState.auth, successMessage: 'Profile updated successfully.' } };
    render(
      <Provider store={mockStore(state)}>
        <ProfilePage />
      </Provider>
    );
    expect(screen.getByText('Profile updated successfully.')).toBeTruthy();
  });

  test('shows error banner when error is set', () => {
    const state = { auth: { ...baseState.auth, error: 'Wrong password.' } };
    render(
      <Provider store={mockStore(state)}>
        <ProfilePage />
      </Provider>
    );
    expect(screen.getByText('Wrong password.')).toBeTruthy();
  });

  test('submit button shows loading state', () => {
    const state = { auth: { ...baseState.auth, isLoading: true } };
    render(
      <Provider store={mockStore(state)}>
        <ProfilePage />
      </Provider>
    );
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
  });
});
