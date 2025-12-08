// src/app/hotkeys/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, doc, query, where, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { type Hotkey as BaseHotkey } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Search, Plus, Trash2, Edit, ChevronDown, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSoftwareContext } from '@/context/software-context';
import { softwareOptions } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { hotkeys as defaultHotkeysData } from '@/lib/data';

type Hotkey = BaseHotkey & { isCustom?: boolean; userId?: string; };
type NewHotkey = Omit<Hotkey, 'id' | 'isCustom' | 'userId'>;

const HotkeyEditor = ({ isOpen, onOpenChange, editingId, currentHotkey, onHotkeyChange, onSave, onCancel }: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editingId: string | null;
    currentHotkey: NewHotkey;
    onHotkeyChange: (hotkey: NewHotkey) => void;
    onSave: () => void;
    onCancel: () => void;
}) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редагувати гарячу клавішу" : "Нова гаряча клавіша"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Внесіть зміни та збережіть." : "Додайте нову комбінацію до вашого довідника."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Select value={currentHotkey.software} onValueChange={(value) => onHotkeyChange({...currentHotkey, software: value as any})}>
            <SelectTrigger>
                <SelectValue placeholder="Виберіть програму" />
            </SelectTrigger>
            <SelectContent>
                {softwareOptions.map(sw => <SelectItem key={sw} value={sw}>{sw}</SelectItem>)}
            </SelectContent>
            </Select>
            <Input placeholder="Команда (напр. Conduit)" value={currentHotkey.command} onChange={e => onHotkeyChange({...currentHotkey, command: e.target.value})} />
            <Input placeholder="Клавіші (напр. CN)" value={currentHotkey.keys} onChange={e => onHotkeyChange({...currentHotkey, keys: e.target.value})} />
            <Textarea placeholder="Опис команди" value={currentHotkey.description} onChange={e => onHotkeyChange({...currentHotkey, description: e.target.value})} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Скасувати</Button>
          <Button onClick={onSave}>Зберегти</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
);

export default function HotkeysPage() {
  const { selectedSoftware } = useSoftwareContext();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userHotkeysQuery = useMemo(() => {
      if (!user || !firestore) return null;
      return query(
          collection(firestore, "users", user.uid, "userHotkeys"),
          where("software", "==", selectedSoftware)
      );
  }, [user, firestore, selectedSoftware]);

  const { data: userHotkeys, isLoading: isLoadingUserHotkeys } = useCollection<Hotkey>(userHotkeysQuery);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentHotkey, setCurrentHotkey] = useState<NewHotkey>({ command: '', keys: '', description: '', software: 'Revit' });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof BaseHotkey; direction: 'ascending' | 'descending' } | null>({ key: 'command', direction: 'ascending'});
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isEditorOpen) {
      setCurrentHotkey(prev => ({...prev, software: selectedSoftware}))
    }
  }, [selectedSoftware, isEditorOpen]);

  const handleSaveHotkey = async () => {
    if (!currentHotkey.command || !currentHotkey.keys || !currentHotkey.description || !user || !firestore) return;
    
    const payload: Omit<Hotkey, 'id'> = {
        command: currentHotkey.command,
        keys: currentHotkey.keys,
        description: currentHotkey.description,
        software: currentHotkey.software,
        userId: user.uid,
        isCustom: true,
    };
    
    try {
        if (editingId) {
          const hotkeyDocRef = doc(firestore, "users", user.uid, "userHotkeys", editingId);
          await setDoc(hotkeyDocRef, payload, { merge: true });
        } else {
          const hotkeysCollection = collection(firestore, 'users', user.uid, 'userHotkeys');
          await addDoc(hotkeysCollection, payload);
        }
    } catch (error) {
        console.error("Error saving hotkey: ", error);
        // Here you could show a toast to the user
    }
    
    handleCancel();
  };
  
  const handleStartEditing = (hotkey: Hotkey) => {
    setEditingId(hotkey.id);
    setCurrentHotkey({
        command: hotkey.command,
        keys: hotkey.keys,
        description: hotkey.description,
        software: hotkey.software,
    });
    setIsEditorOpen(true);
  }

  const handleStartAdding = () => {
    setEditingId(null);
    setCurrentHotkey({ command: '', keys: '', description: '', software: selectedSoftware });
    setIsEditorOpen(true);
  };

  const handleCancel = () => {
    setIsEditorOpen(false);
    setEditingId(null);
    setCurrentHotkey({ command: '', keys: '', description: '', software: selectedSoftware });
  };

  const handleDeleteHotkey = async (id: string) => {
    if (!user || !firestore) return;
    try {
        const hotkeyDocRef = doc(firestore, "users", user.uid, "userHotkeys", id);
        await deleteDoc(hotkeyDocRef);
    } catch (error) {
        console.error("Error deleting hotkey: ", error);
    }
  };

  const allHotkeys = useMemo(() => {
    const baseHotkeys = defaultHotkeysData.filter(h => h.software === selectedSoftware);
    const customHotkeys = userHotkeys || [];
    return [...baseHotkeys, ...customHotkeys];
  }, [selectedSoftware, userHotkeys]);


  const sortedHotkeys = useMemo(() => {
    let sortableItems: Hotkey[] = [...allHotkeys];
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Hotkey] as string || '';
        const valB = b[sortConfig.key as keyof Hotkey] as string || '';
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [allHotkeys, sortConfig]);
  
  const filteredHotkeys = sortedHotkeys.filter((hotkey) =>
    hotkey.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotkey.keys.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotkey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const requestSort = (key: keyof BaseHotkey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof BaseHotkey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };
  
  const HotkeyCard = ({ hotkey }: { hotkey: Hotkey }) => (
    <Accordion type="single" collapsible className="w-full mb-2">
       <AccordionItem value={hotkey.id} className={cn("border rounded-lg overflow-hidden", hotkey.isCustom && "border-accent")}>
       <AccordionTrigger hideChevron className="hover:no-underline p-4 text-left relative">
            <div className="flex items-center justify-between w-full gap-2">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-base break-words truncate">{hotkey.command}</span>
                </div>
                <kbd className="pointer-events-none inline-flex h-auto select-none items-center gap-1 rounded border bg-muted px-3 py-1.5 font-mono text-sm font-medium text-muted-foreground break-words min-h-6 justify-center max-w-[50%]">
                    {hotkey.keys}
                </kbd>
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="pt-4 border-t">
              {hotkey.isCustom ? (
                <>
                    <div className="flex justify-end items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={(e) => { e.stopPropagation(); handleStartEditing(hotkey); }}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()} className="max-w-[calc(100vw-2rem)] w-auto sm:max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Цю дію неможливо скасувати. Це назавжди видалить цю гарячу клавішу.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Скасувати</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteHotkey(hotkey.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Видалити
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
              ) : null}
              <p className="text-sm text-muted-foreground">{hotkey.description}</p>
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (!isClient || isUserLoading || isLoadingUserHotkeys) {
    return (
        <div className="space-y-6 px-2 py-4 md:p-8">
            <div className="animate-pulse">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                     <Skeleton className="h-10 w-full mt-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-96 w-full" />
                  </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 px-2 py-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
              </div>
              <Button onClick={handleStartAdding} className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Додати клавішу
              </Button>
          </div>
           <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Пошук за командою, клавішами або описом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
        </CardHeader>
        <CardContent>
          <HotkeyEditor 
            isOpen={isEditorOpen}
            onOpenChange={setIsEditorOpen}
            editingId={editingId}
            currentHotkey={currentHotkey}
            onHotkeyChange={setCurrentHotkey}
            onSave={handleSaveHotkey}
            onCancel={handleCancel}
          />

          {isMobile ? (
            <div>
              {filteredHotkeys.length > 0 ? (
                <>
                    {filteredHotkeys.map((hotkey) => <HotkeyCard key={hotkey.id} hotkey={hotkey} />)}
                </>
              ) : (
                 <p className="text-center text-muted-foreground py-8">Нічого не знайдено.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-[25%]">
                      <Button variant="ghost" onClick={() => requestSort('command')}>
                        Команда {getSortIndicator('command')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%]">
                       <Button variant="ghost" onClick={() => requestSort('keys')}>
                        Клавіші {getSortIndicator('keys')}
                      </Button>
                    </TableHead>
                    <TableHead>
                       <Button variant="ghost" onClick={() => requestSort('description')}>
                        Опис {getSortIndicator('description')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHotkeys.length > 0 ? (
                    <>
                    {filteredHotkeys.map((hotkey) => (
                      <TableRow key={hotkey.id} className={cn(hotkey.isCustom && "border-accent")}>
                        <TableCell>
                          {hotkey.isCustom && <GripVertical className="h-5 w-5 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-medium">{hotkey.command}</TableCell>
                        <TableCell>
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            {hotkey.keys}
                          </kbd>
                        </TableCell>
                        <TableCell>{hotkey.description}</TableCell>
                        <TableCell className="text-right">
                          {hotkey.isCustom && (
                            <div className='flex gap-1 justify-end items-center'>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => handleStartEditing(hotkey)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Цю дію неможливо скасувати. Це назавжди видалить цю гарячу клавішу.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteHotkey(hotkey.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Видалити
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Нічого не знайдено.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
