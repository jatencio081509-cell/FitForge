import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return null; // or a loading/error screen
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Slot />
    </ClerkProvider>
  );
}