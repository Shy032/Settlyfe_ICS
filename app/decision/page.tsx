"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, History } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

export default function DecisionPage() {
    const [isCreating, setIsCreating] = useState(false)
    type Decision = {
        id: string;
        title: string;
        content: string;
        createdDate: string;
        createdBy: string;
    };
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [createdDate, setCreatedDate] = useState(new Date().toISOString().split("T")[0])
    const [useToday, setUseToday] = useState(false);
    const { user, isAdmin } = useAuth()
    const [newDecision, setNewDecision] = useState<Decision>({
        id: "", 
        title: "",
        content: "",
        createdDate, 
        createdBy: user?.name || "Unknown"
    });
    const { t } = useTranslation(user?.preferredLanguage as any)
    const router = useRouter()

    useEffect(() => {
        const mockDecisions: Decision[] = [
            {
                id: "1",
                title: "Kickoff Meeting",
                content: "We decided on initial responsibilities and sprint schedule.",
                createdDate: "2025-07-01",
                createdBy: "David"
            },
            {
                id: "2",
                title: "Design Approval",
                content: "Team approved the Figma design for the homepage.",
                createdDate: "2025-07-03",
                createdBy: "Rex"
            },
            {
                id: "3",
                title: "API Tech Stack",
                content: "We chose Node.js and Express for backend APIs.",
                createdDate: "2025-07-05",
                createdBy: "Richard"
            },
        ];
        setDecisions(mockDecisions);
    }, []);

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                const res = await fetch("/api/decisions");
                if (!res.ok) throw new Error("Failed to fetch decisions");
                const data: Decision[] = await res.json();
                setDecisions(data);
            } catch (error) {
                console.error("Error fetching decisions:", error);
            }
        };

        fetchDecisions();
    }, []);

    const createDecision = async (decision: Omit<Decision, "id">) => {
        try {
            const res = await fetch("/api/decisions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(decision)
            });

            if (!res.ok) throw new Error("Failed to create decision");

            const savedDecision: Decision = await res.json(); // backend returns full decision with ID
            setDecisions((prev) => [...prev, savedDecision]);
            setIsCreating(false);
            setNewDecision({ id: "", title: "", content: "", createdDate: "", createdBy: "" });
        } catch (error) {
            console.error("Error creating decision:", error);
        }
    };

    return(
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 neon:bg-background">
            <div className="bg-white dark:bg-gray-800 neon:bg-card shadow-sm border-b dark:border-gray-700 neon:border-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white neon:text-primary">{t("decisions")}</h1>
                            <p className="text-gray-600 dark:text-gray-300 neon:text-muted-foreground">
                                Executive decisions made by the team
                            </p>
                            <p></p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsCreating(true)}
                                className="neon:bg-primary neon:text-background neon:glow-primary"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t("createDecision")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-screen px-4 py-8">
                <VerticalTimeline
                    className="!min-h-screen"
                >
                    {decisions.length > 0 ? (
                    decisions
                        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                        .map((decision) => (
                        <VerticalTimelineElement
                            key={decision.id}
                            date={decision.createdDate}
                            iconStyle={{ background: '#10b981', color: '#fff' }}
                            contentStyle={{ background: '#EEEEEE', color: '#111827' }}
                            contentArrowStyle={{ borderRight: '7px solid #EEEEEE' }}
                        >
                            <h3 className="font-semibold text-lg">{decision.title}</h3>
                            <p className="mt-2 text-gray-600 dark:text-black">{decision.content}</p>
                            <p className="text-sm text-gray-500 dark:text-black mt-1">
                            Created by: {decision.createdBy}
                            </p>
                        </VerticalTimelineElement>
                        ))
                    ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                        No decisions yet.
                    </div>
                    )}
                </VerticalTimeline>
            </div>

            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 neon:bg-card neon:border-primary">
                <DialogHeader>
                    <DialogTitle className="dark:text-white neon:text-primary">Create New Decision</DialogTitle>
                    <DialogDescription className="dark:text-gray-300 neon:text-muted-foreground">
                        Add a new decision to the board
                    </DialogDescription>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const decisionToSend: Omit<Decision, "id"> = {
                            title: newDecision.title,
                            content: newDecision.content,
                            createdDate: newDecision.createdDate,
                            createdBy: user?.name || "Unknown"
                            };
                            await createDecision(decisionToSend);
                        }}
                    >
                        <div className="mt-4">
                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 neon:text-muted-foreground">
                                Title
                            </Label>
                            <Input
                                name="title"
                                type="text"
                                value={newDecision.title}
                                onChange={(e) =>
                                    setNewDecision({ ...newDecision, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="mt-4">
                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 neon:text-muted-foreground">
                                Description
                            </Label>
                            <Textarea
                                name="description"
                                value={newDecision.content}
                                onChange={(e) =>
                                    setNewDecision({ ...newDecision, content: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-row mt-4 w-full justify-between space-x-4">
                            <div className="flex-[5]">
                                <Label htmlFor="dueDate" className="dark:text-gray-200 neon:text-foreground">
                                {t("createdDate")}
                                </Label>
                                <Input
                                    name="createdDate"
                                    type="date"
                                    value={newDecision.createdDate}
                                    onChange={(e) => {
                                        setCreatedDate(e.target.value);
                                        setNewDecision({ ...newDecision, createdDate: e.target.value });
                                    }}
                                />
                            </div>
                            <div className="flex items-center space-x-2 mt-6 flex-1">
                                <input
                                    type="checkbox"
                                    id="todayToggle"
                                    checked={useToday}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setUseToday(checked);
                                        if (checked) {
                                            const today = new Date().toISOString().split("T")[0];
                                            setCreatedDate(today);
                                            setNewDecision({ ...newDecision, createdDate: today });
                                        }
                                    }}
                                    className={`
                                        w-4 h-4 border-2 rounded
                                        appearance-none cursor-pointer
                                        checked:bg-gray-800
                                        bg-gray-200 border-gray-400
                                        dark:bg-gray-700 dark:border-gray-500
                                        dark:checked:bg-black
                                    `}
                                />
                                <Label htmlFor="todayToggle" className="text-sm dark:text-gray-300 neon:text-muted-foreground">
                                Today
                                </Label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                type="submit"
                                onClick={() => {
                                    // Handle decision creation logic here
                                    setIsCreating(false)
                                }}
                                className="neon:bg-primary neon:text-background neon:glow-primary"
                            >
                                Create Decision
                            </Button>
                        </div>
                    </form>
                </DialogHeader>
                
                </DialogContent>
            </Dialog>

        </div>
    )
}