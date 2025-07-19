
'use server';
/**
 * @fileOverview An AI flow for simulating metadata (EXIF) analysis from an image.
 *
 * - analyzeImageMetadata - A function that returns a simulated EXIF report.
 * - MetadataAnalysisInput - The input type for the function.
 * - MetadataAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MetadataAnalysisInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image as a data URI that must include a MIME type and use Base64 encoding."
    ),
  filename: z.string().describe('The filename of the image.'),
});
export type MetadataAnalysisInput = z.infer<typeof MetadataAnalysisInputSchema>;

const ExifTagSchema = z.object({
  tag: z.string().describe('The name of the EXIF tag (e.g., "Make", "Model", "GPSLatitude").'),
  value: z.string().describe('The value of the EXIF tag.'),
});

const MetadataAnalysisOutputSchema = z.object({
  hasPii: z.boolean().describe('Whether the simulated EXIF data contains potential PII like GPS coordinates.'),
  summary: z.string().describe('A one-sentence summary of the most notable findings.'),
  exifData: z.array(ExifTagSchema).describe('A list of 5-8 plausible, simulated EXIF tags found in the image.'),
});
export type MetadataAnalysisOutput = z.infer<typeof MetadataAnalysisOutputSchema>;

export async function analyzeImageMetadata(input: MetadataAnalysisInput): Promise<MetadataAnalysisOutput> {
  return metadataAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'metadataAnalysisPrompt',
  input: {schema: MetadataAnalysisInputSchema},
  output: {schema: MetadataAnalysisOutputSchema},
  prompt: `You are a digital forensics tool specializing in EXIF data analysis.
  Your task is to generate a realistic, simulated EXIF data report for the given image.

  Image: {{media url=imageDataUri}}
  Filename: {{{filename}}}

  - Generate a plausible list of 5-8 EXIF tags that could be found in an image like this.
  - Sometimes include GPS coordinates (GPSLatitude, GPSLongitude) to represent a PII risk. Set the 'hasPii' flag accordingly.
  - Include common tags like camera Make/Model, DateTimeOriginal, ISO, FNumber, etc.
  - Provide a one-sentence summary highlighting the most interesting simulated finding (e.g., "Image contains GPS data pointing to a location in San Francisco.").
  
  The output should be purely for simulation.
  `,
});

const metadataAnalysisFlow = ai.defineFlow(
  {
    name: 'metadataAnalysisFlow',
    inputSchema: MetadataAnalysisInputSchema,
    outputSchema: MetadataAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
