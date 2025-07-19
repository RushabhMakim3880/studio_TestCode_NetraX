
'use server';
/**
 * @fileOverview An AI flow for extracting Indicators of Compromise (IoCs) from text.
 *
 * - extractIoCs - A function that extracts IoCs from a block of text.
 * - IocExtractorInput - The input type for the function.
 * - IocExtractorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IocExtractorInputSchema = z.object({
  rawText: z.string().min(20).describe('A block of raw text, such as logs, reports, or analyst notes, from which to extract IoCs.'),
});
export type IocExtractorInput = z.infer<typeof IocExtractorInputSchema>;

const IocExtractorOutputSchema = z.object({
  ips: z.array(z.string()).describe('A list of unique IP addresses (IPv4 or IPv6) found in the text.'),
  domains: z.array(z.string()).describe('A list of unique domain names found in the text.'),
  hashes: z.array(z.object({
    type: z.enum(['MD5', 'SHA1', 'SHA256', 'Unknown']).describe('The type of hash.'),
    value: z.string().describe('The hash value.'),
  })).describe('A list of unique file hashes (MD5, SHA1, SHA256) found in the text.'),
  files: z.array(z.string()).describe('A list of unique file paths or filenames mentioned in the text.'),
});
export type IocExtractorOutput = z.infer<typeof IocExtractorOutputSchema>;

export async function extractIoCs(input: IocExtractorInput): Promise<IocExtractorOutput> {
  return iocExtractorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'iocExtractorPrompt',
  input: {schema: IocExtractorInputSchema},
  output: {schema: IocExtractorOutputSchema},
  prompt: `You are a Senior Security Operations Center (SOC) analyst specializing in parsing unstructured data to find Indicators of Compromise (IoCs).
Your task is to thoroughly analyze the provided text and extract all potential IoCs.

- Identify all IPv4 and IPv6 addresses.
- Identify all fully qualified domain names (FQDNs). Do not extract URLs, only the domain part.
- Identify all common file hashes (MD5, SHA1, SHA256). For each hash, determine its type. If you cannot determine the type, label it as 'Unknown'.
- Identify all file paths or executable names (e.g., /tmp/evil.sh, malware.exe).
- Ensure all extracted lists contain unique values only. Do not duplicate entries.
- If no IoCs of a certain type are found, return an empty array for that type.

Raw Text for Analysis:
\`\`\`
{{{rawText}}}
\`\`\`
`,
});

const iocExtractorFlow = ai.defineFlow(
  {
    name: 'iocExtractorFlow',
    inputSchema: IocExtractorInputSchema,
    outputSchema: IocExtractorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
