
'use client';

import { RubberDuckyEditor } from '@/components/rubber-ducky-editor';
import { PasswordCracker } from '@/components/password-cracker';
import { HashCalculator } from '@/components/hash-calculator';
import { ExploitSuggester } from '@/components/exploit-suggester';
import { PayloadGenerator } from '@/components/payload-generator';
import { CustomMalwareGenerator } from '@/components/custom-malware-generator';
import { EncoderDecoder } from '@/components/encoder-decoder';
import { RealPortScanner } from '@/components/real-port-scanner';

export default function OffensivePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Offensive Toolkit</h1>
        <p className="text-muted-foreground">A collection of tools for penetration testing and red team operations.</p>
      </div>

      <RealPortScanner />
      
      <PayloadGenerator />

      <CustomMalwareGenerator />

      <ExploitSuggester />

      <PasswordCracker />

      <HashCalculator />

      <EncoderDecoder />

      <RubberDuckyEditor />
    </div>
  );
}
