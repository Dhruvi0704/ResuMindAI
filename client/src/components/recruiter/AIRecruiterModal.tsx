import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AIRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetJobTitle: string;
  onEvaluate: (jobDescription: string) => Promise<void>;
  isLoading: boolean;
}

export default function AIRecruiterModal({ isOpen, onClose, targetJobTitle, onEvaluate, isLoading }: AIRecruiterModalProps) {
  const [jobDescription, setJobDescription] = useState("");
  const { toast } = useToast();

  const handleEvaluate = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste a job description to evaluate against.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onEvaluate(jobDescription);
      // Don't close immediately, let the parent component handle state changes
    } catch (error) {
      console.error("Evaluation failed", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI Recruiter Simulation</DialogTitle>
          <DialogDescription>
            Simulate how an ATS and an AI Recruiter would evaluate your resume against a specific job role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Target Role</h4>
            <div className="p-3 bg-muted rounded-md border border-border">
              {targetJobTitle || "Not specified"}
            </div>
            <p className="text-xs text-muted-foreground">
              This is pulled directly from your resume. If incorrect, please update your resume title first.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Job Description <span className="text-red-500">*</span></h4>
            <Textarea
              placeholder="Paste the full job description here..."
              className="min-h-[200px]"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleEvaluate} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            {isLoading ? "Evaluating..." : "Start Evaluation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
