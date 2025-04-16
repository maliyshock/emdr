"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Play, Pause, Plus, Minus, Settings, FileText, Trash2, Calendar, ChevronDown, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
} from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

// Define the Note type
type Note = {
  id: string
  title: string
  content: string
  date: string
}

// Define the AppState type
type AppState = {
  gap: number
  amplitude: number
  speed: number
  dotColor: string
  notes: Note[]
}

// LocalStorage keys
const APP_STATE_KEY = "emdr-app-state"
const NOTES_KEY = "emdr-notes"

export default function EMDRApp() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [gap, setGap] = useState(40)
  const [amplitude, setAmplitude] = useState(50)
  const [speed, setSpeed] = useState(1)
  const [dotColor, setDotColor] = useState("#00ffaa")
  const [openSettings, setOpenSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newNote, setNewNote] = useState<Omit<Note, "id">>({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Save app state to localStorage
  const saveAppState = () => {
    const appState: AppState = {
      gap,
      amplitude,
      speed,
      dotColor,
      notes,
    }

    try {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState))
    } catch (error) {
      console.error("Error saving app state to localStorage:", error)
    }
  }

  // Load app state from localStorage
  const loadAppState = () => {
    try {
      const savedState = localStorage.getItem(APP_STATE_KEY)

      if (savedState) {
        const parsedState: AppState = JSON.parse(savedState)

        setGap(parsedState.gap)
        setAmplitude(parsedState.amplitude)
        setSpeed(parsedState.speed)
        setDotColor(parsedState.dotColor)
        setNotes(parsedState.notes)

        return true
      }
    } catch (error) {
      console.error("Error loading app state from localStorage:", error)
    }

    return false
  }

  // Manual save function with feedback
  const handleManualSave = () => {
    saveAppState()
    toast({
      title: "Settings saved",
      description: "Your settings and notes have been saved to this device.",
    })
  }

  // Load app state on initial render
  useEffect(() => {
    // Try to load the full app state first
    const stateLoaded = loadAppState()

    // If full state wasn't loaded, try to load just the notes (for backward compatibility)
    if (!stateLoaded) {
      const savedNotes = localStorage.getItem(NOTES_KEY)
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes))
      }
    }
  }, [])

  // Save app state whenever relevant state changes
  useEffect(() => {
    // Use a debounce to avoid excessive writes
    const saveTimeout = setTimeout(() => {
      saveAppState()
    }, 500)

    return () => clearTimeout(saveTimeout)
  }, [gap, amplitude, speed, dotColor, notes, saveAppState])

  useEffect(() => {
    document.body.style.setProperty("--animation-play-state", isRunning ?'running':'paused');
  }, [isRunning]);

  useEffect(() => {
    document.body.style.setProperty("--amplitude", String(amplitude));
  }, [amplitude]);

  // Focus title input when form appears
  useEffect(() => {
    if (showNoteForm && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [showNoteForm])

  const toggleRunning = () => {
    setIsRunning(!isRunning)
  }

  const incrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    increment: number,
    min = 1,
    max = 100,
  ) => {
    setter(Math.min(max, Math.max(min, value + increment)))
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newNote.title.trim()) {
      // Focus the title input if it's empty
      if (titleInputRef.current) {
        titleInputRef.current.focus()
      }
      return
    }

    const newNoteWithId = {
      ...newNote,
      id: Date.now().toString(),
    }

    setNotes((prev) => [newNoteWithId, ...prev])

    // Reset the form
    setNewNote({
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
    })

    // Hide the form
    setShowNoteForm(false)
  }

  const handleCancelNote = () => {
    // Reset the form
    setNewNote({
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
    })

    // Hide the form
    setShowNoteForm(false)
  }

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setNewNote({
        ...newNote,
        date: date.toISOString().split("T")[0],
      })
      setCalendarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm py-4 px-6 fixed top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">EMDR Therapy</h1>

          <div className="flex items-center gap-3">
            <Button
              className={cn("px-6", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600")}
              onClick={toggleRunning}
              size="default"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Start
                </>
              )}
            </Button>
            {/* Notes Sidebar Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Notes">
                  <FileText className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[350px] sm:w-[450px] border-r p-0">
                <div className="p-6">
                  <SheetHeader>
                    <SheetTitle>Session Notes</SheetTitle>
                  </SheetHeader>
                </div>

                {showNoteForm ? (
                  <div className="bg-gray-100 dark:bg-gray-800 py-6 px-6 border-y">
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="note-date">Date</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <div className="relative cursor-pointer">
                              <Input
                                id="note-date"
                                value={format(new Date(newNote.date), "PPP")}
                                className="pr-10 cursor-pointer"
                                readOnly
                              />
                              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(newNote.date)}
                              onSelect={handleDateSelect}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note-title">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="note-title"
                          ref={titleInputRef}
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          placeholder="Enter note title"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note-content">Content</Label>
                        <Textarea
                          id="note-content"
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          placeholder="Enter your thoughts..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          Add New Note
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelNote}>
                          Close
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="px-6 py-4">
                    <Button
                      onClick={() => setShowNoteForm(true)}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Note
                    </Button>
                  </div>
                )}

                <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
                  <h3 className="font-medium mb-4">Your Notes</h3>

                  {notes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No notes yet. Add your first note above.</p>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {notes.map((note) => (
                        <AccordionItem key={note.id} value={note.id} className="border rounded-md group">
                          <div className="relative">
                            <AccordionTrigger className="px-4 py-3 w-full flex items-center hover:no-underline">
                              <ChevronDown className="h-4 w-4 mr-2 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              <div className="text-left flex-1">
                                <div className="font-medium">{note.title}</div>
                                <div className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString('ru')}</div>
                              </div>
                            </AccordionTrigger>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this note? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <AccordionContent className="px-4 pb-3 pt-1">
                            <div className="whitespace-pre-wrap">{note.content}</div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Settings Button */}
            <Popover open={openSettings} onOpenChange={setOpenSettings}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6" align="end">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Settings</h3>
                    <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleManualSave}>
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>

                  <div className="border-t pt-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="color-picker" className="text-sm font-medium">
                        Dot Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="color-picker"
                          type="color"
                          value={dotColor}
                          onChange={(e) => setDotColor(e.target.value)}
                          className="w-8 h-8 rounded-md border cursor-pointer"
                        />
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: dotColor }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Gap</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setGap, gap, -5, 10, 200)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center">{gap}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setGap, gap, 5, 10, 200)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Slider value={[gap]} min={10} max={200} step={1} onValueChange={(value) => setGap(value[0])} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Amplitude</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setAmplitude, amplitude, -5, 10, 50)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center">{amplitude}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setAmplitude, amplitude, 5, 10, 50)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[amplitude]}
                      min={10}
                      max={50}
                      step={1}
                      onValueChange={(value) => setAmplitude(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Speed</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setSpeed, speed, -0.5, 0.5, 10)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center">{speed.toFixed(1)}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementValue(setSpeed, speed, 0.5, 0.5, 10)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[speed]}
                      min={0.5}
                      max={10}
                      step={0.1}
                      onValueChange={(value) => setSpeed(value[0])}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto pt-24 pb-8 px-4 flex flex-col items-center">
        {/* Dots Visualization Area */}
        <div className="relative w-full h-60 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl shadow-inner flex items-center justify-center">
          <div
            className="absolute top-1/2 left-1/2 flex emdr"
            style={{
              animationName: isRunning ? "move" : "stop",
              animationDuration: `${amplitude / speed || 1}s`,
            }}
          >
            <div className="emdr__inner">
              <div
                className="rounded-full transition-transform"
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: dotColor,
                  marginRight: `${gap}px`,
                  boxShadow: `0 0 10px ${dotColor}80`,
                }}
              />
              <div
                className="rounded-full transition-transform"
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: dotColor,
                  boxShadow: `0 0 10px ${dotColor}80`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

