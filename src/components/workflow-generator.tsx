
'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Video, StopCircle, PlusSquare, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateWorkflowSummary, type WorkflowSummaryOutput } from '@/ai/flows/workflow-summary-flow';

type WorkflowStep = {
  imageDataUrl: string;
  description: string;
};

export function WorkflowGenerator() {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepDescription, setStepDescription] = useState('');
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const tempImageDataUrl = useRef<string | null>(null);

  const { toast } = useToast();

  const handleStartRecording = () => {
    setIsRecording(true);
    setSteps([]);
    toast({ title: "Recording Started", description: "Use the '+' button to capture steps." });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast({ title: "Recording Stopped" });
  };

  const handleCaptureStep = async () => {
    setIsCapturing(true);
    toast({ title: "Capturing screen...", description: "Please wait a moment." });
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        // Ignore the workflow generator itself in the screenshot
        ignoreElements: (element) => element.id === 'workflow-generator-controls',
      });
      tempImageDataUrl.current = canvas.toDataURL('image/png');
      setStepDescription('');
      setIsStepModalOpen(true);
    } catch (error) {
      console.error("Failed to capture screen:", error);
      toast({ variant: 'destructive', title: "Capture Failed", description: "Could not take a screenshot." });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSaveStep = () => {
    if (tempImageDataUrl.current) {
      setSteps(prev => [...prev, { imageDataUrl: tempImageDataUrl.current!, description: stepDescription }]);
      toast({ title: `Step ${steps.length + 1} Captured`, description: "Your step has been saved." });
      tempImageDataUrl.current = null;
      setIsStepModalOpen(false);
    }
  };
  
  const generatePdf = async () => {
    if (steps.length === 0) {
      toast({ variant: 'destructive', title: "No steps captured", description: "Please capture at least one step before generating a guide." });
      return;
    }
    
    setIsGenerating(true);
    toast({ title: "Generating PDF Guide...", description: "This may take a moment." });

    try {
      let aiSummary: WorkflowSummaryOutput = { title: "My Workflow Guide", summary: "A step-by-step guide generated from captured actions." };
      
      const stepDescriptions = steps.map(s => s.description).filter(d => d.trim() !== '');
      if (stepDescriptions.length > 0) {
         try {
            aiSummary = await generateWorkflowSummary({ stepDescriptions });
         } catch (aiError) {
            console.warn("AI summary failed, using default text.", aiError);
            toast({ variant: 'destructive', title: "AI Summary Failed", description: "Using default text for the guide." });
         }
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;

      // Add Title
      pdf.setFontSize(22);
      pdf.text(aiSummary.title, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Add Summary
      pdf.setFontSize(12);
      const summaryLines = pdf.splitTextToSize(aiSummary.summary, pageWidth - margin * 2);
      pdf.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 10;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        if (y > pageHeight - margin - 40) { // Check if there's enough space for the next step header
          pdf.addPage();
          y = margin;
        }

        // Add Step Title
        pdf.setFontSize(16);
        const stepTitle = `Step ${i + 1}: ${step.description.split('\n')[0]}`;
        pdf.text(stepTitle, margin, y);
        y += 8;

        // Add Step Description
        if (step.description) {
            pdf.setFontSize(10);
            const descLines = pdf.splitTextToSize(step.description, pageWidth - margin * 2);
            pdf.text(descLines, margin, y);
            y += descLines.length * 4 + 5;
        }
        
        // Add Image
        const img = new Image();
        img.src = step.imageDataUrl;
        await new Promise(resolve => img.onload = resolve);
        
        const imgProps = pdf.getImageProperties(step.imageDataUrl);
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        if (y + imgHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
        
        pdf.addImage(step.imageDataUrl, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      pdf.save(`${aiSummary.title.replace(/\s/g, '_').toLowerCase()}.pdf`);

    } catch (error) {
      console.error("PDF Generation failed:", error);
      toast({ variant: 'destructive', title: "PDF Generation Failed", description: "An error occurred while creating the PDF." });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <>
      <div id="workflow-generator-controls" className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-card/80 p-2 border shadow-lg backdrop-blur-sm">
        {isRecording ? (
          <>
            <Button size="icon" className="rounded-full" onClick={handleCaptureStep} disabled={isCapturing}>
              {isCapturing ? <Loader2 className="animate-spin" /> : <PlusSquare />}
              <span className="sr-only">Capture Step</span>
            </Button>
            <Button size="icon" className="rounded-full bg-destructive hover:bg-destructive/80" onClick={handleStopRecording}>
              <StopCircle />
              <span className="sr-only">Stop Recording</span>
            </Button>
          </>
        ) : (
          <Button size="icon" className="rounded-full" onClick={handleStartRecording}>
            <Video />
            <span className="sr-only">Start Recording</span>
          </Button>
        )}
        {steps.length > 0 && !isRecording && (
          <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600" onClick={generatePdf} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown />}
            <span className="sr-only">Generate Guide</span>
          </Button>
        )}
      </div>

      <Dialog open={isStepModalOpen} onOpenChange={setIsStepModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Describe This Step</DialogTitle>
            <DialogDescription>
              Add a description for the captured screenshot. This will be included in the final guide.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g., 'Navigated to the user management page and clicked on the admin user...'"
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStepModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStep}>Save Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
