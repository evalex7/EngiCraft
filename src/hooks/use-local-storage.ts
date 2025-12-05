"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// Custom hook to manage state with localStorage, ensuring SSR compatibility.
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    
    // This state holds the value. We initialize it with the initialValue
    // to prevent mismatches during server rendering.
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // This state tracks if the component has mounted on the client.
    const [hasMounted, setHasMounted] = useState(false);

    // After the component mounts, we update the state with the value from localStorage.
    useEffect(() => {
        setHasMounted(true);
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.log(error);
        }
    }, [key]);

    // This function is the "setter" that updates both the state and localStorage.
    const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
        // We only proceed if we're on the client side.
        if (typeof window === 'undefined') {
            console.warn(`Tried setting localStorage key “${key}” on the server.`);
            return;
        }

        try {
            // Allow value to be a function so we have the same API as useState
            const newValue = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(newValue);
            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    // If not mounted yet (i.e., on the server or initial client render),
    // return the initial value.
    if (!hasMounted) {
        return [initialValue, () => {}] as [T, Dispatch<SetStateAction<T>>];
    }

    return [storedValue, setValue];
}
