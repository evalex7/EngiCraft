'use client';

import { useMemo, type DependencyList } from 'react';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { FirebaseProvider, FirebaseContext, type FirebaseContextValue } from './provider';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';

import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from './non-blocking-updates';
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

/**
 * A wrapper around React.useMemo that "marks" the memoized value.
 * This is used to ensure that Firestore queries passed to custom hooks
 * like useCollection are properly memoized, preventing infinite re-render loops.
 * The __memo flag is a private check used by the hooks.
 */
export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (memoized && typeof memoized === 'object') {
    // Add a non-enumerable property to mark the object as memoized.
    Object.defineProperty(memoized, '__memo', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  return memoized;
}

export {
  // Providers
  FirebaseProvider,
  // Hooks
  useCollection,
  useDoc,
  // Non-blocking writes
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
};
