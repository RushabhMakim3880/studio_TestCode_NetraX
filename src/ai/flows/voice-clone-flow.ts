
'use server';
/**
 * @fileOverview An AI flow for generating speech from text using pre-built voices.
 *
 * - generateVoice - A function that returns a WAV audio file as a data URI.
 * - GenerateVoiceInput - The input type for the function.
 * - GenerateVoiceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const GenerateVoiceInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().describe('The pre-built voice to use.'),
});
export type GenerateVoiceInput = z.infer<typeof GenerateVoiceInputSchema>;

const GenerateVoiceOutputSchema = z.object({
  media: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type GenerateVoiceOutput = z.infer<typeof GenerateVoiceOutputSchema>;


export async function generateVoice(input: GenerateVoiceInput): Promise<GenerateVoiceOutput> {
  return voiceCloneFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const voiceCloneFlow = ai.defineFlow(
  {
    name: 'voiceCloneFlow',
    inputSchema: GenerateVoiceInputSchema,
    outputSchema: GenerateVoiceOutputSchema,
  },
  async ({ text, voice }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio media was returned from the AI model.');
    }
    
    // The returned media URL is a base64 encoded PCM string.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    
    return {
      media: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
