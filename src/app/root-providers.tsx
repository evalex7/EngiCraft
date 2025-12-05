// src/app/root-providers.tsx
"use client";

import AppLayout from "@/components/app-layout";
import { FirebaseProvider } from "@/firebase/provider";
import { SoftwareProvider } from "@/context/software-context";

export default function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseProvider>
            <SoftwareProvider>
                <AppLayout>
                    {children}
                </AppLayout>
            </SoftwareProvider>
        </FirebaseProvider>
    )
}
