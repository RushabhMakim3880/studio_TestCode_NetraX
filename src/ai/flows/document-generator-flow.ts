'use server';
/**
 * @fileOverview An AI flow for generating professional project documents.
 *
 * - generateDocument - Generates content for documents like SOWs, LORs, etc.
 * - DocumentGeneratorInput - The input type for the function.
 * - DocumentGeneratorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DocumentGeneratorInputSchema = z.object({
  documentType: z.enum(['Statement of Work (SOW)', 'Letter of Reconnaissance (LOR)', 'Standard Operating Procedure (SOP)']),
  projectName: z.string().describe("The name of the project or campaign."),
  projectTarget: z.string().describe("The target of the project."),
  projectObjective: z.string().describe("The main goal of the project."),
});
export type DocumentGeneratorInput = z.infer<typeof DocumentGeneratorInputSchema>;

export const DocumentGeneratorOutputSchema = z.object({
  documentTitle: z.string().describe('A suitable title for the generated document.'),
  documentContent: z.string().describe('The full, professionally formatted text content of the document.'),
});
export type DocumentGeneratorOutput = z.infer<typeof DocumentGeneratorOutputSchema>;

export async function generateDocument(input: DocumentGeneratorInput): Promise<DocumentGeneratorOutput> {
  return documentGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentGeneratorPrompt',
  input: {schema: DocumentGeneratorInputSchema},
  output: {schema: DocumentGeneratorOutputSchema},
  prompt: `You are a senior cybersecurity consultant specializing in drafting professional engagement documents.
Your task is to generate the content for the specified document type based on the provided project details.
The document should be well-structured, professional, and comprehensive. Use markdown for formatting like headers, bold text, and lists.

Document Type: {{{documentType}}}
Project Name: "{{{projectName}}}"
Project Target: "{{{projectTarget}}}"
Project Objective: "{{{projectObjective}}}"

- If the document is a 'Statement of Work (SOW)', it should include sections for Introduction, Scope, Objectives, Timeline (provide a plausible high-level timeline), Deliverables, and Assumptions.
- If the document is a 'Letter of Reconnaissance (LOR)', it should be a formal letter authorizing the reconnaissance activities, clearly stating the approved scope and targets.
- If the document is a 'Standard Operating Procedure (SOP)', create a generic SOP for a common red team task related to the project objective (e.g., "SOP for Phishing Campaign Execution").

Generate a suitable title and the full text content for the document.
`,
});

const documentGeneratorFlow = ai.defineFlow(
  {
    name: 'documentGeneratorFlow',
    inputSchema: DocumentGeneratorInputSchema,
    outputSchema: DocumentGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
