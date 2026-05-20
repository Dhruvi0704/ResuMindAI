import { useState, useRef } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Check, Edit, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RecommendedJobs from '@/components/jobs/RecommendedJobs';
import { getDynamicSectionOrder } from '@/utils/resumeSectionUtils';
import AIRecruiterModal from '@/components/recruiter/AIRecruiterModal';
import AIRecruiterReport, { RecruiterEvaluationResult } from '@/components/recruiter/AIRecruiterReport';
import AIResumeOptimizerModal from '@/components/recruiter/AIResumeOptimizerModal';
import { apiRequest } from '@/lib/queryClient';
import { Briefcase, ChevronLeft } from 'lucide-react';

interface ReviewStepProps {
    onBack: () => void;
    onEditStep: (step: string) => void;
}

// Reusable Resume Template Component for both Preview Modal and Hidden Canvas Target
const ResumeTemplate = ({ resumeData }: { resumeData: any }) => {
    const sectionOrder = getDynamicSectionOrder(resumeData.personal.jobTitle);

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case 'personal':
                return (
                    <div key="personal" className="mb-6">
                        <div className="border-b-2 border-gray-800 pb-4">
                            <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900 mb-2">
                                {resumeData.personal.fullName || 'Your Name'}
                            </h1>
                            <p className="text-xl text-gray-700 font-medium mb-3">
                                {resumeData.personal.jobTitle || 'Job Title'}
                            </p>
                            <div className="text-sm text-gray-600 flex gap-3 flex-wrap">
                                <span>{resumeData.personal.email}</span>
                                <span>•</span>
                                <span>{resumeData.personal.phone}</span>
                                <span>•</span>
                                <span>{resumeData.personal.location}</span>
                            </div>
                        </div>

                        {resumeData.personal.professionalSummary && (
                            <div className="mt-6">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-2 pb-1">
                                    Professional Summary
                                </h2>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {resumeData.personal.professionalSummary}
                                </p>
                            </div>
                        )}
                    </div>
                );
            case 'experience':
                return resumeData.experience.length > 0 ? (
                    <div key="experience">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-3 pb-1">
                            Experience
                        </h2>
                        {resumeData.experience.map((exp: any) => (
                            <div key={exp.id} className="mb-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900">{exp.role}</h3>
                                    <span className="text-sm text-gray-600">
                                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{exp.company}</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {exp.responsibilities.map((resp: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700">{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : null;
            case 'projects':
                return resumeData.projects.length > 0 ? (
                    <div key="projects">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-3 pb-1">
                            Projects
                        </h2>
                        {resumeData.projects.map((proj: any) => (
                            <div key={proj.id} className="mb-3">
                                <h3 className="font-semibold text-gray-900">{proj.title}</h3>
                                <p className="text-sm text-gray-700 mb-1">{proj.description}</p>
                                <p className="text-xs text-gray-600">
                                    <strong>Tech Stack:</strong> {proj.techStack.join(', ')}
                                </p>
                                {(proj.githubUrl || proj.liveUrl) && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        {proj.githubUrl && <span>{proj.githubUrl}</span>}
                                        {proj.githubUrl && proj.liveUrl && ' | '}
                                        {proj.liveUrl && <span>{proj.liveUrl}</span>}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : null;
            case 'skills':
                return resumeData.skills.length > 0 ? (
                    <div key="skills">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-2 pb-1">
                            Skills
                        </h2>
                        <p className="text-sm text-gray-700">
                            {resumeData.skills.map((s: any) =>
                                typeof s === "string" ? s : s.name
                            ).join(' • ')}
                        </p>
                    </div>
                ) : null;
            case 'education':
                return resumeData.education.length > 0 ? (
                    <div key="education">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-3 pb-1">
                            Education
                        </h2>
                        {resumeData.education.map((edu: any) => (
                            <div key={edu.id} className="mb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {edu.degree} in {edu.specialization}
                                        </h3>
                                        <p className="text-sm text-gray-700">{edu.institution}</p>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {edu.startDate} - {edu.endDate}
                                    </span>
                                </div>
                                {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                            </div>
                        ))}
                    </div>
                ) : null;
            case 'certifications':
                return resumeData.certifications.length > 0 ? (
                    <div key="certifications">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-2 pb-1">
                            Certifications
                        </h2>
                        {resumeData.certifications.map((cert: any) => (
                            <p key={cert.id} className="text-sm text-gray-700 mb-1">
                                <strong>{cert.name}</strong> - {cert.issuer} ({cert.date})
                            </p>
                        ))}
                    </div>
                ) : null;
            case 'links':
                const links = Object.entries(resumeData.socialLinks).filter(([_, val]) => val);
                return links.length > 0 ? (
                    <div key="links">
                        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-2 pb-1">
                            Links & Portfolio
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                            {links.map(([key, value]) => (
                                <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </a>
                            ))}
                        </div>
                    </div>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {sectionOrder.map(renderSection)}
        </div>
    );
};

export default function ReviewStep({ onBack, onEditStep }: ReviewStepProps) {
    const { state, isFormValid, dispatch } = useResume();
    const { resumeData } = state;
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // AI Recruiter State
    const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [evaluationReport, setEvaluationReport] = useState<RecruiterEvaluationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    // AI Optimizer State
    const [isImproving, setIsImproving] = useState(false);
    const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);
    const [optimizerResult, setOptimizerResult] = useState<{
        optimized_resume: any;
        improvements: string[];
        newEvaluation: RecruiterEvaluationResult;
    } | null>(null);

    const [currentJobDescription, setCurrentJobDescription] = useState("");

    const handleEvaluateResume = async (jobDescription: string) => {
        setIsEvaluating(true);
        setCurrentJobDescription(jobDescription);
        try {
            const res = await apiRequest("POST", "/api/recruiter/evaluate", {
                resumeData,
                jobDescription,
                targetJobTitle: resumeData.personal.jobTitle || "Professional",
            });
            const data = await res.json();
            setEvaluationReport(data);
            setIsRecruiterModalOpen(false);
            setIsReportOpen(true);
            toast({ title: "Evaluation Complete!" });
        } catch (e) {
            toast({ title: "Evaluation Failed", description: "Could not evaluate resume. Please try again.", variant: "destructive" });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleImproveResume = async () => {
        setIsImproving(true);

        try {
            // 1. Call optimizer
            const res = await apiRequest("POST", "/api/optimize-resume", {
                resume: resumeData,
                jobDescription: currentJobDescription,
                jobTitle: resumeData.personal.jobTitle || "Professional"
            });

            const data = await res.json();

            // 2. 🔥 MERGE OLD + NEW (CRITICAL FIX)
            const mergedResume = {
                ...resumeData,
                ...data.optimized_resume
            };

            // 3. 🔥 RE-EVALUATE FULL RESUME
            const evalRes = await apiRequest("POST", "/api/recruiter/evaluate", {
                resumeData: mergedResume,
                jobDescription: currentJobDescription,
                targetJobTitle: resumeData.personal.jobTitle || "Professional"
            });

            const newEvaluation = await evalRes.json();

            // 4. 🔥 GUARANTEE SCORE INCREASE (FINAL FIX)
            const oldScore = evaluationReport?.candidateScore || 0;

            // ❗ Accept only if real improvement
            if (newEvaluation.candidateScore < oldScore) {
                // ❌ reject bad optimization
                toast({
                    title: "No Improvement Detected",
                    description: "Try adding more skills or improving experience for better results.",
                    variant: "destructive"
                });
                setIsReportOpen(true);
                setIsImproving(false);
                return;
            }

            const scoreDiff = newEvaluation.candidateScore - oldScore;

            data.improvements.push(`ATS score improved by +${scoreDiff} points`);

            // 5. SET RESULT
            setOptimizerResult({
                optimized_resume: mergedResume,
                improvements: data.improvements || [],
                newEvaluation
            });

            setIsReportOpen(false);
            setIsOptimizerModalOpen(true);

        } catch (e) {
            toast({
                title: "Improvement Failed",
                description: "Could not improve resume. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsImproving(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            console.log('Starting PDF export...');
            const element = document.getElementById('resume-preview-final');

            if (!element) {
                console.error('Preview element not found in DOM');
                throw new Error('Preview element not found');
            }

            console.log('Element found, capturing with html2canvas...');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            console.log('Canvas created, converting to image...');
            const imgData = canvas.toDataURL('image/png');

            console.log('Creating PDF...');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            const fileName = `${(resumeData.personal.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
            console.log('Saving PDF as:', fileName);
            pdf.save(fileName);

            toast({
                title: 'Success!',
                description: 'Your resume has been downloaded.',
            });
            
            setIsPreviewOpen(false); // Close modal on successful download
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Could not generate PDF. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const sectionOrder = getDynamicSectionOrder(resumeData.personal.jobTitle);

    const allSections: Record<string, any> = {
        personal: {
            title: 'Personal Information',
            step: 'personal',
            items: [
                resumeData.personal.fullName,
                resumeData.personal.jobTitle,
                resumeData.personal.email,
                resumeData.personal.phone,
                resumeData.personal.location,
            ].filter(Boolean),
        },
        education: {
            title: 'Education',
            step: 'education',
            items: resumeData.education.map((e: any) => `${e.degree} in ${e.specialization} - ${e.institution}`),
        },
        skills: {
            title: 'Skills',
            step: 'skills',
            items: resumeData.skills.map((s: any) =>
                typeof s === "string" ? s : s.name
            ),
        },
        experience: {
            title: 'Experience',
            step: 'experience',
            items: resumeData.experience.map((e: any) => `${e.role} at ${e.company}`),
        },
        projects: {
            title: 'Projects',
            step: 'projects',
            items: resumeData.projects.map((p: any) => p.title),
        },
        certifications: {
            title: 'Certifications',
            step: 'certifications',
            items: resumeData.certifications.map((c: any) => c.name),
        },
        links: {
            title: 'Social Links',
            step: 'links',
            items: Object.entries(resumeData.socialLinks)
                .filter(([_, value]) => value)
                .map(([key, _]) => key.charAt(0).toUpperCase() + key.slice(1)),
        },
    };

    const sections = sectionOrder.map(id => allSections[id]).filter(Boolean);

    const completionPercentage = sections.reduce((acc, section) => {
        return acc + (section.items.length > 0 ? 1 : 0);
    }, 0) / sections.length * 100;

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Review Your Resume</h2>
                        <p className="text-muted-foreground">
                            Review all sections before downloading. Click on any section to edit.
                        </p>
                    </div>

                    {/* Completion Status */}
                    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Resume Completion</span>
                            <span className="text-2xl font-bold text-primary">{Math.round(completionPercentage)}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Sections Summary */}
                    <div className="space-y-3">
                        {sections.map((section) => (
                            <div
                                key={section.step}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{section.title}</h3>
                                            {section.items.length > 0 ? (
                                                <Badge variant="default" className="bg-green-500">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Complete
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Empty</Badge>
                                            )}
                                        </div>
                                        {section.items.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {section.items.slice(0, 3).map((item: any, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {item}
                                                    </Badge>
                                                ))}
                                                {section.items.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{section.items.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No items added</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEditStep(section.step)}
                                        className="ml-4"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
                            Back
                        </Button>
                        <Button
                            onClick={() => setIsPreviewOpen(true)}
                            disabled={completionPercentage < 50 || !isFormValid}
                            variant="secondary"
                            size="lg"
                            className="flex-1"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Resume
                        </Button>
                        <Button 
                            onClick={() => setIsRecruiterModalOpen(true)} 
                            disabled={completionPercentage < 50}
                            variant="outline" 
                            size="lg"
                            className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Recruiter Evaluation
                        </Button>
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isExporting || completionPercentage < 50 || !isFormValid}
                            size="lg"
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>
                                    <FileText className="w-4 h-4 mr-2 animate-pulse" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                    </div>

                    {completionPercentage < 50 && (
                        <p className="text-sm text-muted-foreground text-center">
                            Complete at least 50% of your resume to download
                        </p>
                    )}
                    {!isFormValid && completionPercentage >= 50 && (
                        <p className="text-sm text-destructive text-center">
                            Please fix all validation errors before downloading your resume
                        </p>
                    )}
                </div>
            </Card>

            {/* AI Job Recommendations Section */}
            {completionPercentage >= 50 && (
                <div className="mt-8">
                    <RecommendedJobs
                        resumeText={JSON.stringify(resumeData)}
                    />
                </div>
            )}

            {/* Resume Preview Dialog Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[210mm] w-full max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Resume Preview
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto flex-1 p-8 bg-gray-50 flex justify-center">
                        {/* The visible preview in the modal */}
                        <div className="bg-white text-black p-12 shadow-md w-[210mm] min-h-[297mm] transform origin-top md:scale-100 sm:scale-75 scale-50">
                            <ResumeTemplate resumeData={resumeData} />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-background">
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Close Preview
                        </Button>
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Generating PDF...' : 'Download Resume PDF'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Recruiter Modal & Report */}
            <AIRecruiterModal
                isOpen={isRecruiterModalOpen}
                onClose={() => setIsRecruiterModalOpen(false)}
                targetJobTitle={resumeData.personal.jobTitle}
                onEvaluate={handleEvaluateResume}
                isLoading={isEvaluating}
            />

            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                    AI Recruiter Insights
                                </h2>
                                <p className="text-muted-foreground mt-1">Based on '{evaluationReport?.evaluatedJobTitle || resumeData.personal.jobTitle}' role</p>
                            </div>
                            <Button variant="ghost" onClick={() => setIsReportOpen(false)}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back to Editor
                            </Button>
                        </div>
                        
                        {evaluationReport && (
                            <AIRecruiterReport
                                report={evaluationReport}
                                onImproveClick={handleImproveResume}
                                isImproving={isImproving}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Optimizer Modal for Side-by-Side Review before accepting changes */}
            <AIResumeOptimizerModal
                isOpen={isOptimizerModalOpen}
                onClose={() => setIsOptimizerModalOpen(false)}
                onAccept={() => {
                    if (!optimizerResult) return;

                    dispatch({
                        type: 'UPDATE_ENTIRE_RESUME',
                        payload: optimizerResult!.optimized_resume
                    });

                    setEvaluationReport(optimizerResult!.newEvaluation);

                    toast({
                        title: "Resume Optimized!",
                        description: "AI improvements successfully applied to your resume."
                    });

                    setOptimizerResult(null);
                    setIsOptimizerModalOpen(false);
                }}
                optimized_resume={optimizerResult?.optimized_resume}
                original_resume={resumeData}
                improvements={optimizerResult?.improvements || []}
                oldEvaluation={evaluationReport}
                newEvaluation={optimizerResult?.newEvaluation || null}
            />

            {/* Off-screen Preview for PDF Export (using the same generic component) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    id="resume-preview-final"
                    className="bg-white text-black p-12"
                    style={{ width: '210mm', minHeight: '297mm' }}
                >
                    <ResumeTemplate resumeData={resumeData} />
                </div>
            </div>
        </div>
    );
}
