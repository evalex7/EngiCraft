// src/app/root-providers.tsx
"use client";

import AppLayout from "@/components/app-layout";
import { FirebaseClientProvider } from "@/firebase";
import { SoftwareProvider } from "@/context/software-context";

export default function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <SoftwareProvider>
            <FirebaseClientProvider>
                <AppLayout>
                    {children}
                </AppLayout>
            </FirebaseClientProvider>
        </SoftwareProvider>
    )
}
