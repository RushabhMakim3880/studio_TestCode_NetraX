'use server';
/**
 * @fileOverview An AI flow for generating compliance checklists.
 *
 * - generateComplianceChecklist - Generates a checklist for a given standard.
 * - VaptInput - The input type for the generateComplianceChecklist function.
 * - VaptOutput - The return type for the generateComplianceChecklist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VaptInputSchema = z.object({
  standard: z.string().describe("The compliance standard (e.g., 'PCI-DSS', 'HIPAA', 'ISO 27001')."),
});
export type VaptInput = z.infer<typeof VaptInputSchema>;

const VaptOutputSchema = z.object({
  checklist: z.array(z.object({
    id: z.string().describe('A unique identifier for the control.'),
    category: z.string().describe('The category of the control.'),
    description: z.string().describe('A description of the compliance control.'),
  })).describe('A list of compliance checklist items.'),
});
export type VaptOutput = z.infer<typeof VaptOutputSchema>;

export async function generateComplianceChecklist(input: VaptInput): Promise<VaptOutput> {
  return vaptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vaptPrompt',
  input: {schema: VaptInputSchema},
  output: {schema: VaptOutputSchema},
  prompt: `You are a senior cybersecurity auditor and compliance expert.
  Your task is to generate a high-level compliance checklist for a specific standard.

  Standard: {{{standard}}}

  Generate a list of 10-15 key controls for this standard. For each control, provide a short ID, a category, and a clear description.
  The items should represent major requirements of the standard.

  Example for PCI-DSS:
  - id: "REQ-3.1"
  - category: "Protect Stored Cardholder Data"
  - description: "Keep cardholder data storage to a minimum by implementing data retention and disposal policies, procedures and processes."

  Do not include conversational text.
  `,
});

const vaptFlow = ai.defineFlow(
  {
    name: 'vaptFlow',
    inputSchema: VaptInputSchema,
    outputSchema: VaptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
