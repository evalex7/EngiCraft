'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseConfig as fileConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Function to build config from environment variables
const getConfigFromEnv = () => {
  const envConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  // Check if all required fields are present
  if (Object.values(envConfig).every(value => value)) {
    return envConfig;
  }
  return null;
};


// Helper to initialize Firebase
function getFirebaseApp(): FirebaseApp {
    const envConfig = getConfigFromEnv();
    const configToUse = envConfig || fileConfig;

    if (getApps().length > 0) {
        // If an app is already initialized, check if its config matches the desired one.
        const currentApp = getApp();
        const currentConfig = currentApp.options;
        if (
            currentConfig.apiKey === configToUse.apiKey &&
            currentConfig.projectId === configToUse.projectId
        ) {
            return currentApp; // Return existing app if config matches
        }
        // NOTE: Firebase does not allow re-initialization with a different config.
        // This scenario might require a page reload in a real-world app if configs could change dynamically.
        // For this context, we assume config is stable per environment.
        return currentApp; 
    }
    
    // If no app is initialized, initialize with the determined config.
    return initializeApp(configToUse);
}

// React Context
export const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

// User auth state
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  // Initialize services. These are stable and won't change on re-renders.
  const services = useMemo(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    const { auth } = services;
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { 
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { 
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [services]); // Depends on the stable services object

  // Memoize the full context value
  const contextValue = useMemo((): FirebaseContextValue => {
    return {
      firebaseApp: services.app,
      firestore: services.firestore,
      auth: services.auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [services, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};
