import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Edit, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function MyDocuments() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: resumes, isLoading } = useQuery({
        queryKey: ["resumes"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/resumes");
            return res.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Note: Delete endpoint usually needs to be implemented in backend if not exists
            // Assuming generic CRUD or specific delete route. 
            // Checking routes.ts... wait, I verified routes.ts and I didn't see a DELETE endpoint for resumes!
            // I will need to add that too. For now I will comment this out or handle it.
            // Actually I should add the DELETE endpoint to routes.ts first. Acknowledge this in plan.
            await apiRequest("DELETE", `/api/resumes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] });
            toast({ title: "Deleted", description: "Resume deleted successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete resume.", variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                                <main className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
                            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            
            <main className="flex-grow py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">My Documents</h1>
                            <p className="text-muted-foreground mt-1">Manage your created resumes and CVs</p>
                        </div>
                        <Link href="/cv-generator">
                            <Button>Create New</Button>
                        </Link>
                    </div>

                    {Array.isArray(resumes) && resumes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resumes.map((resume: any) => (
                                <Card key={resume.id} className="p-6 hover:shadow-lg transition-shadow bg-white group relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <FileText className="w-8 h-8 text-blue-600" />
                                        </div>
                                        {/* <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(resume.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div> */}
                                    </div>

                                    <h3 className="font-semibold text-lg mb-2 line-clamp-1" title={resume.title}>
                                        {resume.title || "Untitled Resume"}
                                    </h3>

                                    <div className="flex items-center text-sm text-muted-foreground mb-6">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Updated {format(new Date(resume.updatedAt), "MMM d, yyyy")}
                                    </div>

                                    <div className="flex gap-3">
                                        <Link href={`/cv-generator?id=${resume.id}`}>
                                            <Button variant="outline" className="w-full">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                        </Link>
                                        {/* Future: Add Export/Download directly from here */}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No documents found</h3>
                            <p className="text-muted-foreground mb-6">Start by creating your first professional resume</p>
                            <Link href="/cv-generator">
                                <Button>Create Resume</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

                    </div>
    );
}
