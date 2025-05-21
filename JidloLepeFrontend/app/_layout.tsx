import React from 'react';
import { AuthProvider } from '@/src/context/authContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <AuthProvider>
        {children}
      </AuthProvider>
  );
}
