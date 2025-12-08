
// src/app/workflows/page.tsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { Plus, Trash2, Edit, Clock, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { softwareOptions, workflows as defaultWorkflowsData } from "@/lib/data";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, doc, addDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

type Workflow = BaseWorkflow;
type NewWorkflow = Omit<Workflow, 'id' | 'isCustom' | 'userId'>;

type WorkflowEditorProps = {
  isEditing: boolean;
  initialWorkflow: NewWorkflow;
  onSave: (workflow: NewWorkflow) => void;
  onCancel: () => void;
  software: string;
};

const WorkflowEditor = ({ isEditing, initialWorkflow, onSave, onCancel, software }: WorkflowEditorProps) => {
  const [workflow, setWorkflow] = useState(initialWorkflow);

  useEffect(() => {
    setWorkflow(initialWorkflow);
  }, [initialWorkflow]);

  const handleFieldChange = (field: keyof NewWorkflow, value: any) => {
    setWorkflow(prev => ({...prev, [field]: value}));
  };

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...workflow.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    handleFieldChange('steps', newSteps);
  };

  const addStep = () => {
    handleFieldChange('steps', [...workflow.steps, { description: '', timestamp: '' }]);
  };

  const removeStep = (index: number) => {
    const newSteps = workflow.steps.filter((_, i) => i !== index);
    if (newSteps.length === 0) {
      handleFieldChange('steps', [{ description: '', timestamp: '' }]);
    } else {
      handleFieldChange('steps', newSteps);
    }
  };

  const handleInternalSave = () => {
    if (!workflow.title || !workflow.description) return;
    onSave(workflow);
  };

  return (
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle>{isEditing ? 'Редагувати процес' : `Новий процес для ${software}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={workflow.software} onValueChange={(value) => handleFieldChange('software', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Виберіть програму" />
              </SelectTrigger>
              <SelectContent>
                {softwareOptions.map(sw => <SelectItem key={sw} value={sw}>{sw}</SelectItem>)}
              </SelectContent>
          </Select>
          <Input placeholder="Заголовок" value={workflow.title} onChange={e => handleFieldChange('title', e.target.value)} />
          <Textarea placeholder="Короткий опис процесу" value={workflow.description} onChange={e => handleFieldChange('description', e.target.value)} />
          <div>
            <label className="text-sm font-medium">Кроки</label>
            <div className="space-y-4 mt-2">
              {workflow.steps.map((step, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md bg-background/50">
                    <Textarea 
                        value={step.description} 
                        onChange={e => handleStepChange(index, 'description', e.target.value)} 
                        placeholder={`Опис кроку ${index + 1}`} 
                        rows={2} 
                        className="resize-y" 
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Input 
                            value={step.timestamp} 
                            onChange={e => handleStepChange(index, 'timestamp', e.target.value)} 
                            placeholder="Час (1m20s)" 
                            className="flex-1"
                        />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeStep(index)} 
                            disabled={workflow.steps.length === 1 && workflow.steps[0].description === ''}
                            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive self-end sm:self-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addStep} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Додати крок
            </Button>
          </div>
          <Input placeholder="ID або посилання на YouTube відео" value={workflow.videoId} onChange={e => handleFieldChange('videoId', e.target.value)} />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Скасувати</Button>
          <Button onClick={handleInternalSave}>Зберегти</Button>
        </CardFooter>
      </Card>
  )
};


export default function WorkflowsPage() {
  const { selectedSoftware } = useSoftwareContext();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userWorkflowsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "userWorkflows"),
      where("software", "==", selectedSoftware)
    );
  }, [user, firestore, selectedSoftware]);

  const { data: userWorkflows, isLoading: isLoadingWorkflows } = useCollection<Workflow>(userWorkflowsQuery);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeVideo, setActiveVideo] = useState<{videoId: string; startTime: number} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const allWorkflows = useMemo(() => {
    const baseWorkflows = defaultWorkflowsData.filter(w => w.software === selectedSoftware);
    const customWorkflows = userWorkflows || [];
    return [...baseWorkflows, ...customWorkflows].sort((a,b) => (a.isCustom ? -1 : 1));
  }, [selectedSoftware, userWorkflows]);


  const handleSaveWorkflow = useCallback(async (workflowData: NewWorkflow) => {
    if (!user || !firestore) return;
    
    const workflowPayload: Omit<Workflow, 'id'> = { 
      ...workflowData, 
      userId: user.uid,
      isCustom: true,
      steps: workflowData.steps.filter(s => s.description.trim() !== '') 
    };

    try {
        if (editingId) {
          const workflowDocRef = doc(firestore, "users", user.uid, "userWorkflows", editingId);
          await updateDoc(workflowDocRef, workflowPayload as any);
        } else {
          const workflowsCollection = collection(firestore, "users", user.uid, "userWorkflows");
          await addDoc(workflowsCollection, workflowPayload);
        }
    } catch (error) {
        console.error("Error saving workflow: ", error);
    }

    handleCancel();
  }, [user, firestore, editingId]);
  
  const handleStartEditing = (workflow: Workflow) => {
    setEditingId(workflow.id);
    setIsAdding(false);
  };

  const handleStartAdding = () => {
    setEditingId(null);
    setIsAdding(true);
  }

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
  }, []);

  const handleDeleteWorkflow = async (id: string) => {
    if (!user || !firestore) return;
    try {
        const workflowDocRef = doc(firestore, "users", user.uid, "userWorkflows", id);
        await deleteDoc(workflowDocRef);
    } catch(error) {
        console.error("Error deleting workflow: ", error);
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

  const extractVideoId = (urlOrId: string): string => {
    if (!urlOrId) return '';
  
    // Check if it's already a valid 11-character ID
    if (/^[\w-]{11}$/.test(urlOrId)) {
      return urlOrId;
    }
  
    // Regex to find video ID from various YouTube URL formats
    const regex = /(?:v=|youtu\.be\/|embed\/|watch\?v=|\/v\/)([\w-]{11})/;
    const match = urlOrId.match(regex);
  
    if (match) {
      return match[1];
    }
  
    // Fallback if no match is found (e.g., could be a malformed string)
    // We try to parse it as a URL to handle edge cases, but within a try-catch
    try {
      const url = new URL(urlOrId);
      if (url.hostname.includes('youtube.com')) {
        return url.searchParams.get('v') || url.pathname.split('/').pop() || '';
      }
      if (url.hostname === 'youtu.be') {
        return url.pathname.slice(1);
      }
    } catch (e) {
      // If new URL() fails, it's not a valid URL. We can just return the original string or an empty one.
      // Returning the original string might still work if it's just the ID but with extra characters.
      // But it's safer to return the best guess or fallback to the original input.
      return urlOrId; 
    }
    
    return urlOrId; // Final fallback
  };

  const editorWorkflow = useMemo(() => {
    if (editingId) {
      const w = allWorkflows?.find(w => w.id === editingId);
      if (w) {
        return {
          ...w,
          steps: w.steps.length > 0 ? w.steps : [{ description: '', timestamp: '' }]
        };
      }
    }
    // Default for new workflow
    return { title: '', description: '', steps: [{ description: '', timestamp: '' }], videoId: '', software: selectedSoftware };
  }, [editingId, allWorkflows, selectedSoftware]);

  const showEditor = isAdding || editingId !== null;

  if (!isClient || isUserLoading || isLoadingWorkflows) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="animate-pulse">
                <div className="h-10 bg-muted rounded w-48 ml-auto mb-6"></div>
                <div className="h-64 bg-muted rounded-lg"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-end">
        {!showEditor && (
          <Button onClick={handleStartAdding}>
            <Plus className="mr-2 h-4 w-4" /> Створити процес
          </Button>
        )}
      </div>

       {showEditor ? (
        <WorkflowEditor 
          isEditing={!!editingId}
          initialWorkflow={editorWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={handleCancel}
          software={selectedSoftware}
        />
      ) : (
        <>
            {activeVideo && (
            <div className="mb-6">
                <YoutubePlayer videoId={activeVideo.videoId} startTime={activeVideo.startTime} onEnded={() => setActiveVideo(null)} />
            </div>
          )}
          <Card>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full" onValueChange={() => setActiveVideo(null)}>
                  {allWorkflows && allWorkflows.length > 0 ? (
                    allWorkflows.map((workflow) => (
                      <AccordionItem value={workflow.id} key={workflow.id} className={cn('data-[state=open]:bg-muted/50 rounded-lg')}>
                        <AccordionTrigger className="text-left hover:no-underline px-4 py-4">
                          <div className="flex flex-1 pr-4 items-start">
                            {workflow.isCustom && <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1 mr-2 hidden sm:block" />}
                            <div className="flex flex-col flex-1">
                              <span className="font-semibold text-base">{workflow.title}</span>
                              <span className="font-normal text-sm text-muted-foreground text-left">{workflow.description}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 pt-4 border-t">
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
                                <Button variant="secondary" onClick={() => handlePlayFromTimestamp(workflow.videoId!)}>
                                  Дивитись відео-урок
                                </Button>
                              </div>
                            )}
                            {workflow.isCustom && (
                              <div className="flex justify-end pt-4 gap-2 border-t mt-4">
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
                    <div className="text-center py-16 px-6">
                        <p className="text-muted-foreground">У вас ще немає робочих процесів для {selectedSoftware}.</p>
                        <Button variant="link" className="mt-2" onClick={handleStartAdding}>Створити перший процес</Button>
                    </div>
                  )}
                </Accordion>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

