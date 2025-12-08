// src/app/notes/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, Search, Edit } from "lucide-react";
import Image from "next/image";
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
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, doc, query, where, serverTimestamp, type Timestamp, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useSoftwareContext } from "@/context/software-context";
import { type UserNote as BaseUserNote } from "@/lib/data";

// Extend the base note type to include the required updated timestamp
type Note = BaseUserNote & {
    updatedAt: Timestamp;
};

const defaultNoteState: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = { title: "", content: "", category: "", imageUrl: "" };

export default function NotesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { selectedSoftware } = useSoftwareContext();

  const notesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "userNotes"),
      where("category", "==", selectedSoftware)
    );
  }, [user, firestore, selectedSoftware]);

  const { data: notes, isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);

  const [currentNote, setCurrentNote] = useState<Omit<Note, 'id' | 'userId'>>(defaultNoteState as Omit<Note, 'id' | 'userId'>);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isAdding && !editingId) {
      setCurrentNote(prev => ({...prev, category: selectedSoftware}));
    }
  }, [selectedSoftware, isAdding, editingId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentNote({ ...currentNote, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !firestore) return;
    if (currentNote.title.trim() === "" || currentNote.content.trim() === "") return;

    const notePayload: Partial<Note> & { updatedAt: any } = {
        userId: user.uid,
        title: currentNote.title,
        content: currentNote.content,
        category: selectedSoftware,
        updatedAt: serverTimestamp(),
      };

      if (currentNote.imageUrl) {
        notePayload.imageUrl = currentNote.imageUrl;
      }

    try {
        if (editingId) {
          const noteDocRef = doc(firestore, "users", user.uid, "userNotes", editingId);
          await setDoc(noteDocRef, notePayload, { merge: true });
        } else {
          notePayload.createdAt = serverTimestamp();
          const notesCollection = collection(firestore, 'users', user.uid, 'userNotes');
          await addDoc(notesCollection, notePayload);
        }
    } catch (error) {
        console.error("Error saving note: ", error);
    }
    
    handleCancel();
  };
  
  const handleStartEditing = (note: Note) => {
    setEditingId(note.id);
    setCurrentNote({
      title: note.title,
      content: note.content,
      imageUrl: note.imageUrl || "",
      category: note.category,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
    setIsAdding(false);
  };
  
  const handleStartAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setCurrentNote({...defaultNoteState, category: selectedSoftware} as Omit<Note, 'id'|'userId'>);
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentNote(defaultNoteState as Omit<Note, 'id' | 'userId'>);
  };

  const handleDeleteNote = async (id: string) => {
    if (!user || !firestore) return;
    try {
        const noteDocRef = doc(firestore, "users", user.uid, "userNotes", id);
        await deleteDoc(noteDocRef);
    } catch (error) {
        console.error("Error deleting note: ", error);
    }
  };
  
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    
    return notes
      .filter(note => {
        const matchesSearch = searchTerm.trim() === '' ||
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });
  }, [notes, searchTerm]);
  
  const showForm = isAdding || editingId !== null;

  if (!isClient || isUserLoading) {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="animate-pulse">
                <div className="h-10 bg-muted rounded w-48 mb-6"></div>
                <div className="h-12 bg-muted rounded w-full mb-8"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="h-64 bg-muted rounded-lg"></div>
                    <div className="h-64 bg-muted rounded-lg"></div>
                    <div className="h-64 bg-muted rounded-lg"></div>
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Доступ обмежено</CardTitle>
                    <CardDescription>Будь ласка, увійдіть, щоб переглядати та створювати нотатки.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        {!showForm && (
          <Button onClick={handleStartAdding}>
            <Plus className="mr-2 h-4 w-4" /> Створити нотатку
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>{editingId ? "Редагувати нотатку" : `Нова нотатка для ${selectedSoftware}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Заголовок нотатки"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
            />
            <Textarea
              placeholder="Зміст нотатки, опис скріншоту..."
              value={currentNote.content}
              onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
              rows={4}
            />
            <div className="flex items-center gap-4">
                {currentNote.imageUrl ? (
                <div className="relative w-40 h-24">
                    <Image src={currentNote.imageUrl} alt="Uploaded image" layout="fill" className="rounded-md object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={() => setCurrentNote({...currentNote, imageUrl: ""})}>
                    <Trash2 className="h-3 w-3"/>
                    </Button>
                </div>
                ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Завантажити скріншот
                </Button>
                )}
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              Скасувати
            </Button>
            <Button onClick={handleSaveNote}>Зберегти</Button>
          </CardFooter>
        </Card>
      )}

      {notes && notes.length > 0 && !showForm && (
         <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Пошук в нотатках..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </CardHeader>
         </Card>
      )}

      {isLoadingNotes && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card><CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader><CardContent><div className="h-16 bg-muted rounded"></div></CardContent></Card>
            <Card><CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader><CardContent><div className="h-16 bg-muted rounded"></div></CardContent></Card>
            <Card><CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader><CardContent><div className="h-16 bg-muted rounded"></div></CardContent></Card>
        </div>
      )}

      {!isLoadingNotes && filteredNotes.length === 0 && !showForm ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{notes && notes.length > 0 ? "Нічого не знайдено за вашим запитом." : `У вас ще немає нотаток для ${selectedSoftware}.`}</p>
          <Button variant="link" className="mt-2" onClick={handleStartAdding}>
            {notes && notes.length > 0 ? "Скинути фільтри або створити нову нотатку" : "Створити першу нотатку"}
            </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="flex flex-col">
               {note.imageUrl && (
                <div className="relative aspect-video w-full">
                  <Image src={note.imageUrl} alt={note.title} fill className="rounded-t-lg object-cover" />
                </div>
              )}
              <CardHeader className="py-4">
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow py-0">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
              <CardFooter className="flex justify-end items-center pt-4 pb-4 gap-1">
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => handleStartEditing(note)}>
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
                        Цю дію неможливо скасувати. Це назавжди видалить вашу нотатку.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
