// src/app/workflows/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Workflow as BaseWorkflow, type WorkflowStep } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { YoutubePlayer } from "@/components/youtube-player";
import { useSoftwareContext } from "@/context/software-context";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Save, X, Clock, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { softwareOptions } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";

type Workflow = BaseWorkflow;
type NewWorkflow = Omit<Workflow, 'id' | 'isCustom' | 'userId'>;

export default function WorkflowsPage() {
  const { selectedSoftware } = useSoftwareContext();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const workflowsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "userWorkflows"),
      where("software", "==", selectedSoftware)
    );
  }, [user, firestore, selectedSoftware]);

  const { data: userWorkflows, isLoading: isLoadingWorkflows } = useCollection<Workflow>(workflowsQuery);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [currentWorkflow, setCurrentWorkflow] = useState<NewWorkflow>({ title: '', description: '', steps: [{ description: '', timestamp: '' }], videoId: '', software: 'Revit' });
  const [activeVideo, setActiveVideo] = useState<{videoId: string; startTime: number} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isAdding && !editingId) {
        setCurrentWorkflow(prev => ({...prev, software: selectedSoftware, steps: [{ description: '', timestamp: '' }], title: '', description: '', videoId: ''}))
    }
  }, [selectedSoftware, isAdding, editingId]);

  const handleSaveWorkflow = () => {
    if (!currentWorkflow.title || !currentWorkflow.description || !user || !firestore) return;
    
    const workflowPayload: Omit<Workflow, 'id'> = { 
      ...currentWorkflow, 
      userId: user.uid,
      isCustom: true,
      steps: currentWorkflow.steps.filter(s => s.description.trim() !== '') 
    };

    if (editingId) {
      const workflowDocRef = doc(firestore, "users", user.uid, "userWorkflows", editingId);
      setDocumentNonBlocking(workflowDocRef, workflowPayload, { merge: true });
      setEditingId(null);
    } else {
      const workflowsCollection = collection(firestore, "users", user.uid, "userWorkflows");
      addDocumentNonBlocking(workflowsCollection, workflowPayload);
      setIsAdding(false);
    }

    setCurrentWorkflow({ title: '', description: '', steps: [{ description: '', timestamp: '' }], videoId: '', software: selectedSoftware });
  };
  
  const handleStartEditing = (workflow: Workflow) => {
    setEditingId(workflow.id);
    const steps = workflow.steps.length > 0 ? workflow.steps : [{ description: '', timestamp: '' }];
    setCurrentWorkflow({ ...workflow, steps });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentWorkflow({ title: '', description: '', steps: [{ description: '', timestamp: '' }], videoId: '', software: selectedSoftware });
  };

  const handleDeleteWorkflow = (id: string) => {
    if (!user || !firestore) return;
    const workflowDocRef = doc(firestore, "users", user.uid, "userWorkflows", id);
    deleteDocumentNonBlocking(workflowDocRef);
  };
  
  const handleStepChange = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...currentWorkflow.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setCurrentWorkflow({...currentWorkflow, steps: newSteps});
  };

  const addStep = () => {
    setCurrentWorkflow({...currentWorkflow, steps: [...currentWorkflow.steps, { description: '', timestamp: '' }]});
  };

  const removeStep = (index: number) => {
    const newSteps = currentWorkflow.steps.filter((_, i) => i !== index);
    if (newSteps.length === 0) {
      setCurrentWorkflow({...currentWorkflow, steps: [{ description: '', timestamp: '' }]});
    } else {
      setCurrentWorkflow({...currentWorkflow, steps: newSteps});
    }
  };
  
  const parseTime = (timeStr?: string): number => {
    if (!timeStr) return 0;
    let totalSeconds = 0;
    const minutesMatch = timeStr.match(/(\d+)\s*m/);
    const secondsMatch = timeStr.match(/(\d+)\s*s/);

    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    }
    const standaloneSeconds = timeStr.match(/(?<!\d\s*m\s*)(\d+)\s*s?$/);
    if (secondsMatch && !minutesMatch) {
        totalSeconds += parseInt(secondsMatch[1], 10);
    } else if (standaloneSeconds && !timeStr.includes('m')) {
        totalSeconds += parseInt(standaloneSeconds[1], 10);
    } else if (secondsMatch && minutesMatch) {
        const secondsPart = timeStr.split('m')[1];
        if(secondsPart) {
            const sMatch = secondsPart.match(/(\d+)\s*s/);
            if (sMatch) totalSeconds += parseInt(sMatch[1], 10);
        }
    } else if (/^\d+$/.test(timeStr)) {
      totalSeconds = parseInt(timeStr, 10);
    }

    return totalSeconds;
  };

  const handlePlayFromTimestamp = (videoId: string, timestamp?: string) => {
    setActiveVideo({
        videoId: extractVideoId(videoId),
        startTime: parseTime(timestamp)
    });
  }

  const extractVideoId = (urlOrId: string) => {
    if (!urlOrId) return '';
    try {
      if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
        const url = new URL(urlOrId);
        if (url.hostname === 'youtu.be') {
          return url.pathname.slice(1).split('?')[0];
        }
        if (url.searchParams.has('v')) {
          return url.searchParams.get('v')!;
        }
      }
    } catch (e) {
      // Ignore invalid URLs and treat as ID
    }
    return urlOrId.split('?')[0];
  }

  const WorkflowEditor = ({ isEditing }: { isEditing: boolean }) => (
      <Card className="mb-6 bg-muted/50">
        <CardHeader><CardTitle>{isEditing ? 'Редагувати процес' : 'Новий робочий процес'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={currentWorkflow.software} onValueChange={(value) => setCurrentWorkflow(prev => ({...prev, software: value as any}))}>
              <SelectTrigger>
                <SelectValue placeholder="Виберіть програму" />
              </SelectTrigger>
              <SelectContent>
                {softwareOptions.map(sw => <SelectItem key={sw} value={sw}>{sw}</SelectItem>)}
              </SelectContent>
            </Select>
          <Input placeholder="Заголовок" value={currentWorkflow.title} onChange={e => setCurrentWorkflow({...currentWorkflow, title: e.target.value})} />
          <Textarea placeholder="Короткий опис процесу" value={currentWorkflow.description} onChange={e => setCurrentWorkflow({...currentWorkflow, description: e.target.value})} />
          <div>
            <label className="text-sm font-medium">Кроки</label>
            <div className="space-y-2 mt-2">
              {currentWorkflow.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Textarea value={step.description} onChange={e => handleStepChange(index, 'description', e.target.value)} placeholder={`Опис кроку ${index + 1}`} rows={1} className="resize-y" />
                  <Input value={step.timestamp} onChange={e => handleStepChange(index, 'timestamp', e.target.value)} placeholder="Час (1m20s)" className="w-32" />
                  <Button variant="ghost" size="icon" onClick={() => removeStep(index)} disabled={currentWorkflow.steps.length <= 1 && currentWorkflow.steps[0].description === ''}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addStep} className="mt-2">
                <Plus className="mr-2 h-4 w-4" /> Додати крок
            </Button>
          </div>
          <Input placeholder="ID або посилання на YouTube відео" value={currentWorkflow.videoId} onChange={e => setCurrentWorkflow({...currentWorkflow, videoId: e.target.value})} />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}><X className="mr-2 h-4 w-4" /> Скасувати</Button>
          <Button onClick={handleSaveWorkflow}><Save className="mr-2 h-4 w-4" /> Зберегти</Button>
        </CardFooter>
      </Card>
  )

  if (!isClient || isUserLoading || isLoadingWorkflows) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="animate-pulse">
                <div className="h-24 bg-muted rounded w-full mb-6"></div>
                <div className="h-64 bg-muted rounded-lg"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
       <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-end gap-4">
              {!isAdding && !editingId && (
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Створити процес
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent>
          {(isAdding || editingId) && <WorkflowEditor isEditing={!!editingId} />}

          {activeVideo && (
            <div className="mb-6">
                <YoutubePlayer videoId={activeVideo.videoId} startTime={activeVideo.startTime} onEnded={() => setActiveVideo(null)} />
            </div>
          )}

          <Accordion type="single" collapsible className="w-full" onValueChange={() => setActiveVideo(null)}>
            {userWorkflows && userWorkflows.length > 0 ? (
              userWorkflows.map((workflow) => (
                <AccordionItem value={workflow.id} key={workflow.id} className={cn(workflow.isCustom && 'bg-info/20 rounded-lg border-blue-200 border')}>
                  <AccordionTrigger className="text-left hover:no-underline px-4">
                    <div className="flex flex-1 pr-4">
                      {workflow.isCustom && <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1 mr-2" />}
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-base">{workflow.title}</span>
                        <span className="font-normal text-sm text-muted-foreground">{workflow.description}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-4">
                      <ol className="space-y-3">
                        {workflow.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">{stepIndex + 1}</span>
                              <div className="flex-1">
                                <p>{step.description}</p>
                                {step.timestamp && workflow.videoId && (
                                   <Button variant="link" size="sm" className="px-0 h-auto py-1" onClick={() => handlePlayFromTimestamp(workflow.videoId!, step.timestamp)}>
                                       <Clock className="mr-2 h-3 w-3" />
                                       Дивитись з {step.timestamp}
                                   </Button>
                                )}
                              </div>
                          </li>
                        ))}
                      </ol>
                      {workflow.videoId && !workflow.steps.some(s => s.timestamp) && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Відео-урок:</h4>
                          <Button variant="secondary" onClick={() => handlePlayFromTimestamp(workflow.videoId!)}>
                            Дивитись відео
                          </Button>
                        </div>
                      )}
                      {workflow.isCustom && (
                         <div className="flex justify-end pt-2 gap-2 border-t mt-4">
                            <Button variant="outline" size="sm" onClick={() => handleStartEditing(workflow)}>
                                <Edit className="h-3 w-3 mr-1" /> Редагувати
                            </Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3 w-3 mr-1" /> Видалити
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Цю дію неможливо скасувати. Це назавжди видалить цей робочий процес.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteWorkflow(workflow.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Видалити
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Робочі процеси для {selectedSoftware} не знайдено.
              </p>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
