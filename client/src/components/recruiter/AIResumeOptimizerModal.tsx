import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  optimized_resume: any;
  original_resume: any; // ✅ IMPORTANT
  improvements: string[];
  oldEvaluation: any;
  newEvaluation: any;
}

// 🔥 DIFF FUNCTION (ChatGPT-style)
const highlightChanges = (oldText: string, newText: string) => {
  if (!oldText) return <span className="text-green-700">{newText}</span>;

  if (oldText === newText) {
    return <span className="text-gray-800">{oldText}</span>;
  }

  return (
    <span>
      <span className="bg-red-100 text-red-600 px-1 rounded line-through">
        {oldText}
      </span>
      {" → "}
      <span className="bg-green-100 text-green-700 px-1 rounded font-semibold">
        {newText}
      </span>
    </span>
  );
};

export default function AIResumeOptimizerModal({
  isOpen,
  onClose,
  onAccept,
  optimized_resume,
  original_resume,
  improvements,
  oldEvaluation,
  newEvaluation
}: Props) {
  const oldSummary = original_resume?.personal?.professionalSummary || "";
  const newSummary = optimized_resume?.personal?.professionalSummary || "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">

        <div className="p-6 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">
                🚀 AI Resume Optimization
              </h2>
              <p className="text-muted-foreground text-sm">
                Real improvements applied to your resume
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-xl font-bold text-green-600">
                {oldEvaluation?.candidateScore || 0} → {newEvaluation?.candidateScore || 0}
              </p>
            </div>
          </div>

          {/* IMPROVEMENTS */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-green-600">✨ What AI Improved</h3>
            <ul className="space-y-1 text-sm">
              {improvements.map((imp, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          {/* BEFORE vs AFTER */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* BEFORE */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold mb-3 text-red-600">Before</h3>

              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-3 text-sm text-gray-800">
                  <p><strong>Summary:</strong></p>
                  <p>
                    {oldSummary || "No summary provided"}
                  </p>
                </div>
              </ScrollArea>
            </div>

            {/* AFTER */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold mb-3 text-green-600">After</h3>

              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-3 text-sm text-gray-800">
                  <p><strong>Summary:</strong></p>
                  <p>
                    {highlightChanges(oldSummary, newSummary)}
                  </p>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* EXPERIENCE CHANGES */}
          {optimized_resume?.experience?.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                🔥 Experience Improvements
              </h3>

              <div className="space-y-3 text-sm">
                {optimized_resume.experience.map((exp: any, i: number) => (
                  <div key={i}>
                    <p className="font-medium text-gray-900">{exp.role}</p>

                    <ul className="list-disc list-inside">
                      {exp.responsibilities?.map((r: string, idx: number) => (
                        <li key={idx} className="text-green-700">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={onAccept}>
              Apply Changes <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}