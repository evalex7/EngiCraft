'use client';

import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { FirebaseProvider, FirebaseContext, type FirebaseContextValue } from './provider';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';

import React from 'react';

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if used outside of a FirebaseProvider.
 */
export const useFirebase = (): FirebaseContextValue => {
  const context = React.useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 */
export const useUser = (): {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
} => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

export {
  // Providers
  FirebaseProvider,
  // Hooks
  useCollection,
  useDoc,
};
