'use client';

import { RubberDuckyEditor } from '@/components/rubber-ducky-editor';
import { HashCalculator } from '@/components/hash-calculator';
import { ExploitSuggester } from '@/components/exploit-suggester';
import { CustomMalwareGenerator } from '@/components/custom-malware-generator';
import { EncoderDecoder } from '@/components/encoder-decoder';
import { ReverseShellPayloadGenerator } from '@/components/reverse-shell-payload-generator';
import { PasswordCracker } from '@/components/password-cracker';
import { YaraRuleGenerator } from '@/components/yara-rule-generator';
import { SessionHijackingTool } from '@/components/session-hijacking-tool';
import { JwtAnalyzer } from '@/components/jwt-analyzer';
import { ClickjackingTool } from '@/components/clickjacking-tool';
import { CredentialReplayer } from '@/components/credential-replayer';
import { LolbinsPayloadGenerator } from '@/components/lolbins-payload-generator';


export default function OffensivePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Offensive Tools</h1>
        <p className="text-muted-foreground">A collection of tools for penetration testing and red team operations.</p>
      </div>

      <ReverseShellPayloadGenerator />
      <LolbinsPayloadGenerator />
      <SessionHijackingTool />
      <ClickjackingTool />
      <JwtAnalyzer />
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
