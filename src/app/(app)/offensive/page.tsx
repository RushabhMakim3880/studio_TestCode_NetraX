
'use client';

import { ReverseShellPayloadGenerator } from '@/components/reverse-shell-payload-generator';
import { HashCalculator } from '@/components/hash-calculator';
import { ExploitSuggester } from '@/components/exploit-suggester';
import { CustomMalwareGenerator } from '@/components/custom-malware-generator';
import { EncoderDecoder } from '@/components/encoder-decoder';
import { LolbinsPayloadGenerator } from '@/components/lolbins-payload-generator';
import { PasswordCracker } from '@/components/password-cracker';
import { YaraRuleGenerator } from '@/components/yara-rule-generator';
import { SessionHijackingTool } from '@/components/session-hijacking-tool';
import { JwtAnalyzer } from '@/components/jwt-analyzer';
import { ClickjackingTool } from '@/components/clickjacking-tool';
import { useAuth } from '@/hooks/use-auth';


export default function OffensivePage() {
  const { user } = useAuth();
  const settings = user?.userSettings?.offensive;

  if (!settings) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Offensive Tools</h1>
        <p className="text-muted-foreground">A collection of tools for penetration testing and red team operations.</p>
      </div>

      {settings.showReverseShell && <ReverseShellPayloadGenerator />}
      {settings.showLolbins && <LolbinsPayloadGenerator />}
      {settings.showSessionHijacking && <SessionHijackingTool />}
      {settings.showClickjacking && <ClickjackingTool />}
      {settings.showJwtAnalyzer && <JwtAnalyzer />}
      {settings.showPasswordCracker && <PasswordCracker />}
      {settings.showCustomMalware && <CustomMalwareGenerator />}
      {settings.showExploitSuggester && <ExploitSuggester />}
      {settings.showYaraGenerator && <YaraRuleGenerator />}
      {settings.showHashCalculator && <HashCalculator />}
      {settings.showEncoderDecoder && <EncoderDecoder />}
      {settings.showRubberDucky && <RubberDuckyEditor />}
    </div>
  );
}
