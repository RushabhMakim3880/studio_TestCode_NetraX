
'use client';

import { RubberDuckyEditor } from '@/components/rubber-ducky-editor';
import { HashCalculator } from '@/components/hash-calculator';
import { ExploitSuggester } from '@/components/exploit-suggester';
import { CustomMalwareGenerator } from '@/components/custom-malware-generator';
import { EncoderDecoder } from '@/components/encoder-decoder';
import { ReverseShellPayloadGenerator } from '@/components/reverse-shell-payload-generator';
import { PasswordCracker } from '@/components/password-cracker';
import { YaraRuleGenerator } from '@/components/yara-rule-generator';


export default function OffensivePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Offensive Tools</h1>
        <p className="text-muted-foreground">A collection of tools for penetration testing and red team operations.</p>
      </div>

      <ReverseShellPayloadGenerator />
      <PasswordCracker />
      <CustomMalwareGenerator />
      <ExploitSuggester />
      <YaraRuleGenerator />
      <HashCalculator />
      <EncoderDecoder />
      <RubberDuckyEditor />
    </div>
  );
}
