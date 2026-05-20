import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardTitle, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, Send, CheckCircle2, AlertCircle, ArrowRight, Video, Timer, EyeOff, MonitorOff, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WebcamPreview } from "@/components/WebcamPreview";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// Types
interface Interview {
    id: string;
    jobTitle: string;
    experienceLevel: string;
    status: string;
}
interface Question {
    id: string;
    question: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
}
interface Answer {
    questionId: string;
    userAnswer: string;
    feedback?: any;
}

// Configuration
const THINKING_TIME_SEC = 30;
const ANSWER_TIME_SEC = 120; // 2 minutes
const MAX_VIOLATIONS = 3;

export default function InterviewSession() {
    const [, params] = useRoute("/mock-interview/:id");
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Session Data
    const [interview, setInterview] = useState<Interview | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);

    // Interview Flow State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer State
    const [phase, setPhase] = useState<'thinking' | 'answering'>('thinking');
    const [timeLeft, setTimeLeft] = useState(THINKING_TIME_SEC);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Proctoring State
    const [violations, setViolations] = useState(0);
    const [cameraError, setCameraError] = useState(false);
    const [integrityScore, setIntegrityScore] = useState(100);
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);
    const [isMultiplePeopleDetected, setIsMultiplePeopleDetected] = useState(false);

    // AI Model
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const requestRef = useRef<number>();
    const lastWarningTimeRef = useRef<number>(0);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    const [interimResult, setInterimResult] = useState("");
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);
    const accumulatedTranscriptRef = useRef(""); // To store finalized text
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const permissionRequestActiveRef = useRef(false); // Used to ignore window blur during permission handling
    const micStreamRef = useRef<MediaStream | null>(null); // Keep the persistent stream alive for built-in mics
    const [micStatus, setMicStatus] = useState<"inactive" | "initializing" | "listening" | "error" | "silence">("inactive");
    const [micErrorMessage, setMicErrorMessage] = useState("");

    const pauseIntegrityMonitoring = () => {
        permissionRequestActiveRef.current = true;
    };

    const resumeIntegrityMonitoring = () => {
        permissionRequestActiveRef.current = false;
    };

    // Load Session
    useEffect(() => {
        if (params?.id) fetchSession(params.id);
    }, [params?.id]);

    // Load AI Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                console.log("AI Proctoring Model Loaded");
            } catch (err) {
                console.error("Failed to load AI model", err);
            }
        };
        loadModel();
    }, []);

    // Object Detection Loop
    const detectFrame = useCallback(async () => {
        if (model && videoRef.current && videoRef.current.readyState === 4) {
            try {
                const predictions = await model.detect(videoRef.current);
                
                const forbiddenGadgets = ["laptop", "tv", "keyboard", "mouse", "remote"];
                const foundGadget = predictions.find(p => forbiddenGadgets.includes(p.class) && p.score > 0.6);
                const foundPhone = predictions.find(p => p.class === "cell phone" && p.score > 0.6);
                const personCount = predictions.filter(p => p.class === "person" && p.score > 0.6).length;

                const now = Date.now();
                const canWarn = now - lastWarningTimeRef.current > 5000; // 5 seconds debounce
                let warned = false;

                if (personCount > 1) {
                    setIsMultiplePeopleDetected(true);
                    if (canWarn) {
                        recordViolation("Multiple People Detected", 15);
                        warned = true;
                    }
                } else {
                    setIsMultiplePeopleDetected(false);
                }

                if (foundPhone) {
                    setIsPhoneDetected(true);
                    handleCriticalViolation("Cell Phone Detected");
                } else if (foundGadget) {
                    setIsPhoneDetected(true);
                    if (canWarn && !warned) {
                        recordViolation(`Forbidden Gadget (${foundGadget.class}) Detected`, 25);
                        warned = true;
                    }
                } else {
                    setIsPhoneDetected(false);
                }

                if (warned) {
                    lastWarningTimeRef.current = now;
                }

            } catch (e) {
                // error during detection (e.g. video not ready)
            }
        }
        requestRef.current = requestAnimationFrame(detectFrame);
    }, [model, violations, integrityScore, interview]);

    useEffect(() => {
        if (model) {
            requestRef.current = requestAnimationFrame(detectFrame);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [model, detectFrame]);


    // Anti-Cheating: Tab Visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Ignore visibility loss if we are actively requesting permission
            if (document.hidden && !loading && interview && !permissionRequestActiveRef.current) {
                recordViolation("Tab Switch / Minimized", 25);
            }
        };

        const handleBlur = () => {
            // Ignore focus loss if we are actively requesting permission
            if (!loading && interview && !permissionRequestActiveRef.current) {
                recordViolation("Window Focus Loss", 15);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [loading, interview, violations]); // Added violations to dependencies to ensure state is fresh

    // Timer Logic
    useEffect(() => {
        if (loading || !interview) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, loading, interview]);

    useEffect(() => {
        if (timeLeft === 0 && !loading && interview) {
            handleTimerExpiry();
        }
    }, [timeLeft, loading, interview, phase]);

    // Speech Recognition Setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true);
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onstart = () => {
                resumeIntegrityMonitoring(); // Successfully got permission
                isListeningRef.current = true;
                setIsListening(true);
                setMicStatus("listening");
                
                // Start initial silence timer (waiting for first words)
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    if (isListeningRef.current) {
                        setMicStatus("silence");
                        recognitionRef.current.stop();
                        // Turn off persistent stream if silence
                        if (micStreamRef.current) {
                            micStreamRef.current.getTracks().forEach(track => track.stop());
                            micStreamRef.current = null;
                        }
                    }
                }, 10000); // 10 seconds of initial dead air
            };

            recognitionRef.current.onresult = (event: any) => {
                // Clear any existing silence timer
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                setMicStatus("listening");

                let currentInterim = '';
                let newFinalText = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newFinalText += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                if (newFinalText) {
                    accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + newFinalText.trim();
                    setUserAnswer(accumulatedTranscriptRef.current);
                }
                
                setInterimResult(currentInterim);
                
                // Set silence timeout for pauses during speech
                silenceTimerRef.current = setTimeout(() => {
                    if (isListeningRef.current) {
                        // We do not immediately stop transcription when a pause occurs,
                        // but if it's been a very long time (15s), show a prompt
                        setMicStatus("silence");
                        recognitionRef.current.stop();
                        // Turn off persistent stream if silence
                        if (micStreamRef.current) {
                            micStreamRef.current.getTracks().forEach(track => track.stop());
                            micStreamRef.current = null;
                        }
                    }
                }, 15000);
            };

            recognitionRef.current.onend = () => {
                // If it ended automatically but wasn't a deliberate stop and wasn't a silence timeout
                if (isListeningRef.current && micStatus !== "silence" && micStatus !== "error") {
                    try { 
                        recognitionRef.current.start(); 
                    } catch (e) {
                        console.error("Microphone restart error:", e);
                    }
                } else {
                    setIsListening(false);
                    isListeningRef.current = false;
                    setInterimResult("");
                    if (micStatus === "listening") setMicStatus("inactive");
                    
                    // Turn off persistent stream
                    if (micStreamRef.current) {
                        micStreamRef.current.getTracks().forEach(track => track.stop());
                        micStreamRef.current = null;
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                
                // Do not override 'initializing' state with premature background errors
                if (micStatus === 'initializing') return;
                
                resumeIntegrityMonitoring(); // Failed or caught error

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    isListeningRef.current = false;
                    setIsListening(false);
                    setMicStatus("error");
                    setMicErrorMessage("Microphone access denied. Please enable microphone access in browser settings.");
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech internally, our manual silenceTimerRef handles the UX
                } else if (event.error === 'network') {
                    setMicStatus("error");
                    setMicErrorMessage("Speech interface requires an internet connection.");
                } else {
                    // Generic fallback for other errors
                    setMicStatus("error");
                    setMicErrorMessage(`Speech recognition error: ${event.error}`);
                }
            };
        }
    }, [toast]);

    const fetchSession = async (id: string) => {
        try {
            const res = await apiRequest("GET", `/api/interviews/${id}`);
            const data = await res.json();
            setInterview(data.interview);
            setQuestions(data.questions);

            // Resume logic
            const answeredIds = new Set(data.answers.map((a: any) => a.questionId));
            const firstUnanswered = data.questions.findIndex((q: any) => !answeredIds.has(q.id));

            if (firstUnanswered !== -1) {
                setCurrentIndex(firstUnanswered);
            } else if (data.questions.length > 0 && data.questions.length === data.answers.length) {
                setLocation(`/mock-interview/${id}/result`);
                return;
            }

            setLoading(false);
            startQuestionTimer();
        } catch (error) {
            toast({ title: "Error", description: "Failed to load session", variant: "destructive" });
        }
    };

    const recordViolation = (type: string, penalty = 10) => {
        // Prevent recording if already terminated or loading
        if (!interview || violations >= MAX_VIOLATIONS) return;

        // Update score ensuring it doesn't go below 0
        const newScore = Math.max(0, integrityScore - penalty);
        setIntegrityScore(newScore);

        const newCount = violations + 1;
        setViolations(newCount);

        toast({
            title: "⚠️ Integrity Violation Detected",
            description: `${type}. Warning ${newCount}/${MAX_VIOLATIONS}. Integrity Score: ${newScore}%`,
            variant: "destructive",
            duration: 5000
        });

        if (newCount >= MAX_VIOLATIONS) {
            terminateInterview("Multiple integrity violations limit reached.");
        }
    };

    const handleCriticalViolation = (type: string) => {
        if (!interview) return;
        // Check if already terminating to avoid loops
        if (integrityScore === 0 && violations >= MAX_VIOLATIONS) return;

        setIntegrityScore(0);
        terminateInterview(`CRITICAL: ${type}. Immediate Termination.`);
    };

    const startQuestionTimer = () => {
        setPhase('thinking');
        setTimeLeft(THINKING_TIME_SEC);
    };

    const skipThinking = () => {
        setPhase('answering');
        setTimeLeft(ANSWER_TIME_SEC);
        // Auto-start microphone if supported when moving to answer phase
        if (isSupported && !isListening) {
            setTimeout(toggleListening, 500);
        }
    };

    const handleTimerExpiry = () => {
        if (phase === 'thinking') {
            setPhase('answering');
            setTimeLeft(ANSWER_TIME_SEC);
            if (isSupported && !isListening) setTimeout(toggleListening, 500);
        } else {
            // Answering time over
            handleSubmitAnswer(true); // Auto submit
        }
    };

    const toggleListening = async () => {
        if (!isSupported) return;
        
        // Reset statuses
        setMicStatus("inactive");
        
        if (isListening) {
            isListeningRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (interimResult.trim()) {
                 accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + interimResult.trim();
                 setUserAnswer(accumulatedTranscriptRef.current);
            }
            setInterimResult("");
        } else {
            setInterimResult("");
            setMicStatus("initializing");
            
            accumulatedTranscriptRef.current = userAnswer; 
            isListeningRef.current = true;

            const startRecognition = () => {
                try {
                    recognitionRef.current?.start();
                } catch (e: any) {
                    // Try to restart if it was already started
                    try {
                        recognitionRef.current?.stop();
                        setTimeout(() => recognitionRef.current?.start(), 100);
                    } catch (err) {
                        console.error("Failed to start speech recognition:", err);
                        setMicStatus("error");
                        setMicErrorMessage("Could not start speech recognition service.");
                    }
                }
            };

            const requestAudioStream = async () => {
                pauseIntegrityMonitoring(); // Temporarily disable integrity monitoring during permission request
                try {
                    // Force audio stream initialization to trigger the browser prompt and keep the microphone alive
                    // This is essential for built-in laptop mics to initialize with proper constraints
                    // and prevents the "hardware not found" delays on some browsers.
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                    
                    micStreamRef.current = stream; // Keep the persistent stream alive in the background
                    resumeIntegrityMonitoring();
                    startRecognition();
                } catch (e: any) {
                    console.error("Failed to start listening stream", e);
                    resumeIntegrityMonitoring(); // Resume on denial
                    
                    if (e.name === 'NotAllowedError' || e.name === 'NotFoundError') {
                        setMicStatus("error");
                        setMicErrorMessage("Microphone access is strictly required. Please check your browser permissions.");
                        return;
                    }
                    setMicStatus("error");
                    setMicErrorMessage("No microphone device detected. Please check your system microphone settings.");
                }
            };

            // 1. Check if permission is already granted so we can avoid touching navigator.mediaDevices if we already have it
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    
                    if (permissionStatus.state === 'granted') {
                        // Already granted: we still want the constrained stream to guarantee built-in laptop mics are noise-cancelled
                        if (!micStreamRef.current) {
                            requestAudioStream();
                        } else {
                            startRecognition();
                        }
                    } else if (permissionStatus.state === 'denied') {
                         setMicStatus("error");
                         setMicErrorMessage("Microphone access is strictly required. Please enable it in browser settings.");
                    } else {
                        // Prompt state
                        requestAudioStream();
                    }
                } else {
                    // Unsuppored browser fallback
                    requestAudioStream();
                }
            } catch (err) {
                 // Fallback if query fails
                 requestAudioStream();
            }
        }
    };

    const handleSubmitAnswer = async (autoSubmit = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Stop timer
        if (timerRef.current) clearInterval(timerRef.current);

        let finalUserAnswer = userAnswer;
        if (isListening) {
            finalUserAnswer = (userAnswer + " " + interimResult).trim();
            isListeningRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            setInterimResult("");
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(track => track.stop());
                micStreamRef.current = null;
            }
        }

        const currentQ = questions[currentIndex];
        const timeTaken = ANSWER_TIME_SEC - timeLeft; // Approx

        try {
            // Submit answer
            await apiRequest("POST", `/api/interviews/${interview?.id}/answer`, {
                questionId: currentQ.id,
                userAnswer: finalUserAnswer || "(No Answer Provided)",
                timeTaken
            });

            // Move to next or finish
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setUserAnswer("");
                setInterimResult("");
                setIsSubmitting(false);
                startQuestionTimer();
            } else {
                finishInterview();
            }

        } catch (error) {
            console.error(error);
            // If error, try to move on anyway to avoid being stuck
            setIsSubmitting(false);
        }
    };

    const finishInterview = async () => {
        try {
            await apiRequest("POST", `/api/interviews/${interview?.id}/finish`, {
                violationCount: violations,
                integrityScore: integrityScore
            });
            setLocation(`/mock-interview/${interview?.id}/result`);
        } catch (e) {
            console.error(e);
        }
    };

    // Use a ref to prevent double-termination calls
    const isTerminatingRef = useRef(false);

    const terminateInterview = async (reason: string) => {
        if (isTerminatingRef.current) return;
        isTerminatingRef.current = true;

        try {
            // Stop loops
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (timerRef.current) clearInterval(timerRef.current);

            await apiRequest("POST", `/api/interviews/${interview?.id}/finish`, {
                violationCount: violations + 1, // Add the final violation
                integrityScore: 0, // Force fail score
                terminationReason: reason
            });

            toast({ title: "Interview Terminated", description: reason, variant: "destructive", duration: 10000 });
            setLocation(`/mock-interview/${interview?.id}/result`);
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 select-none" onContextMenu={(e) => e.preventDefault()}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4 space-y-4">
                            {/* Webcam Preview */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase flex justify-between">
                                    Live Monitor
                                    {isPhoneDetected && <Badge variant="destructive" className="animate-pulse">DEVICE DETECTED</Badge>}
                                    {isMultiplePeopleDetected && <Badge variant="destructive" className="animate-pulse">MULTIPLE PEOPLE</Badge>}
                                </h3>
                                <WebcamPreview
                                    className={`h-40 w-full ${(isPhoneDetected || isMultiplePeopleDetected) ? 'border-4 border-red-600' : ''}`}
                                    onPermissionError={() => {
                                        setCameraError(true);
                                        recordViolation("Camera Access Denied", 30);
                                    }}
                                    onPermissionRequestStart={pauseIntegrityMonitoring}
                                    onPermissionRequestEnd={resumeIntegrityMonitoring}
                                    onVideoRef={(ref) => { videoRef.current = ref; }}
                                />
                                {cameraError && (
                                    <Button variant="secondary" size="sm" onClick={() => {
                                        pauseIntegrityMonitoring();
                                        toast({ title: "Permission Mode Activity", description: "Monitoring paused for 30s. Please update camera permissions in the URL bar." });
                                        setTimeout(resumeIntegrityMonitoring, 30000);
                                    }} className="w-full text-xs mt-2 bg-slate-800 hover:bg-slate-700">
                                        Fix Camera Permissions
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Integrity Status</span>
                                    <span className={integrityScore > 80 ? "text-green-500" : "text-red-500"}>{integrityScore}%</span>
                                </div>
                                <Progress value={integrityScore} className={`h-1 ${integrityScore > 80 ? 'bg-slate-800' : 'bg-red-900'}`} />
                                <div className="text-xs text-slate-500 flex flex-col gap-1">
                                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Violations: {violations}/{MAX_VIOLATIONS}</span>
                                    {isPhoneDetected && <span className="text-red-500 font-bold flex items-center gap-1"><Smartphone className="w-3 h-3" /> Device Detected</span>}
                                    {isMultiplePeopleDetected && <span className="text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Multiple People Detected</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="p-4 py-3 border-b border-slate-800">
                            <CardTitle className="text-sm font-medium">Session Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Q {currentIndex + 1} of {questions.length}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-slate-800" />

                            <div className="space-y-2 mt-4">
                                {questions.map((q, idx) => {
                                    const isCurrent = idx === currentIndex;
                                    const isPast = idx < currentIndex;
                                    return (
                                        <div key={q.id} className={`flex items-center gap-2 text-xs p-2 rounded ${isCurrent ? 'bg-primary/20 text-primary-foreground' : 'text-slate-500'}`}>
                                            {isPast ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            <span className="truncate">Q{idx + 1}: {q.category}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Interaction Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Timer Banner */}
                    <div className={`rounded-xl p-4 flex items-center justify-between border-2 transition-colors ${phase === 'thinking' ? 'bg-blue-950/30 border-blue-500/30' : 'bg-amber-950/30 border-amber-500/30'}`}>
                        <div className="flex items-center gap-3">
                            {phase === 'thinking' ? <Target className="w-6 h-6 text-blue-400" /> : <Timer className="w-6 h-6 text-amber-400" />}
                            <div>
                                <h3 className={`font-bold ${phase === 'thinking' ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {phase === 'thinking' ? "Thinking Time" : "Answer Time"}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {phase === 'thinking' ? "Analyze the question. You cannot type yet." : "Type your answer now."}
                                </p>
                            </div>
                        </div>
                        <div className="text-3xl font-mono font-bold tracking-widest">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>

                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader>
                            <div className="flex justify-between mb-2">
                                <Badge variant="outline" className="border-slate-700 text-slate-300">Question {currentIndex + 1}</Badge>
                                <Badge className={currentQuestion.difficulty === 'Easy' ? 'bg-green-600' : currentQuestion.difficulty === 'Medium' ? 'bg-amber-600' : 'bg-red-600'}>
                                    {currentQuestion.difficulty}
                                </Badge>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-relaxed">{currentQuestion.question}</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col flex-1 gap-4">
                                    <Textarea
                                        className="flex-1 min-h-[250px] bg-slate-950 border-slate-800 text-lg p-6 resize-none focus:ring-primary/50 text-slate-200"
                                        placeholder={phase === 'thinking' ? "Waiting for thinking time..." : isListening ? "Listening... (Your speech will appear below)" : "Type your answer here or click Dictate..."}
                                        value={userAnswer}
                                        onChange={(e) => {
                                            setUserAnswer(e.target.value);
                                            accumulatedTranscriptRef.current = e.target.value; // Keep refs in sync
                                            setInterimResult(""); // Clear interim when user types manually
                                        }}
                                        disabled={phase === 'thinking' || isSubmitting}
                                        spellCheck={false}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            toast({ title: "Action Blocked", description: "Copy/Paste is disabled during interview.", variant: "destructive" });
                                        }}
                                    />
                                    
                                    {/* Mic Status and Live Transcription Box */}
                                    <div className="space-y-3 mt-2">
                                        {micStatus === "listening" && (
                                            <div className="flex items-center gap-2 text-blue-400 bg-blue-950/20 px-3 py-1.5 rounded-md self-start w-max border border-blue-900/50">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider">Listening...</span>
                                            </div>
                                        )}
                                        {micStatus === "initializing" && (
                                            <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-md self-start w-max border border-slate-700 text-sm">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Initializing microphone...
                                            </div>
                                        )}
                                        {micStatus === "error" && (
                                            <div className="flex flex-col gap-2 text-red-400 bg-red-950/20 px-3 py-2 rounded-md self-start w-max border border-red-900/50 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> {micErrorMessage || "Microphone disabled or not detected"}
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    pauseIntegrityMonitoring();
                                                    toast({ title: "Permission Mode Activity", description: "Monitoring paused for 30s. Please update microphone permissions in the URL bar." });
                                                    setTimeout(resumeIntegrityMonitoring, 30000);
                                                }} className="border-red-900/50 text-red-400 hover:bg-red-900/30 text-xs mt-1 w-full justify-center">
                                                    Fix Mic Permissions
                                                </Button>
                                            </div>
                                        )}
                                        {micStatus === "silence" && (
                                            <div className="bg-amber-950/50 border border-amber-900/50 rounded-lg p-4 space-y-3">
                                                <p className="text-amber-300/90 text-sm flex items-start gap-2">
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <span>We could not detect your voice. Please speak clearly and try again.</span>
                                                </p>
                                                <div className="flex flex-wrap gap-3">
                                                    <Button variant="outline" size="sm" onClick={toggleListening} className="border-amber-700/50 hover:bg-amber-900/50 text-amber-100">
                                                        <Mic className="w-4 h-4 mr-2" /> Retry Recording
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={() => setMicStatus("inactive")}>
                                                        Type Answer Instead
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <AnimatePresence>
                                            {(isListening || interimResult) && micStatus !== "silence" && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Transcript</span>
                                                    </div>
                                                    <p className="text-slate-300 italic min-h-[1.5rem] leading-relaxed">
                                                        {interimResult || <span className="text-slate-500">Waiting for speech...</span>}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {phase === 'answering' && (
                                    <div className="flex flex-col justify-end">
                                        <Button
                                            variant="outline"
                                            className={`flex flex-col gap-2 items-center justify-center flex-shrink-0 w-24 h-24 rounded-xl border-2 transition-all duration-300 ${isListening ? "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white"}`}
                                            onClick={toggleListening}
                                            disabled={!isSupported || isSubmitting}
                                        >
                                            {isListening ? <Mic className="!w-12 !h-12" size={48} /> : <MicOff className="!w-12 !h-12" size={48} />}
                                            <span className="text-xs font-semibold">{isListening ? "Recording" : "Start Mic"}</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end p-6 bg-slate-900/50 border-t border-slate-800 gap-3">
                            {phase === 'thinking' ? (
                                <Button onClick={skipThinking} variant="secondary" className="w-full sm:w-auto">
                                    I'm Ready to Answer <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={() => handleSubmitAnswer(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                                    Submit Answer
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    <div className="flex justify-center text-xs text-slate-600 gap-6">
                        <span className="flex items-center gap-1"><MonitorOff className="w-3 h-3" /> Tab Switching Monitored</span>
                        <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> Focus Tracking Active</span>
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Camera Required</span>
                        <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Phone Detection</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
function Target(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
