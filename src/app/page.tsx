// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Book, Keyboard, Zap } from "lucide-react";
import Link from "next/link";
import { useSoftwareContext, type Software } from "@/context/software-context";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { softwareOptions } from "@/lib/data";

export default function DashboardPage() {
  const { selectedSoftware, setSelectedSoftware } = useSoftwareContext();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ToggleGroup
        type="single"
        value={selectedSoftware}
        onValueChange={(value) => {
          if (value) setSelectedSoftware(value as Software);
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {softwareOptions.map(software => (
          <ToggleGroupItem key={software} value={software} aria-label={`Toggle ${software}`} className="flex-grow sm:flex-grow-0">
            {software}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Гарячі клавіші
            </CardTitle>
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Довідник гарячих клавіш для {selectedSoftware}.
            </CardDescription>
            <Button asChild variant="link" className="px-0">
              <Link href="/hotkeys">Перейти <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Робочі процеси
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Інструкції для типових задач в {selectedSoftware}.
            </CardDescription>
            <Button asChild variant="link" className="px-0">
              <Link href="/workflows">Переглянути <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Мої нотатки
            </CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Зберігайте скріншоти, нотатки та корисні матеріали.
            </CardDescription>
            <Button asChild variant="link" className="px-0">
              <Link href="/notes">Відкрити <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
