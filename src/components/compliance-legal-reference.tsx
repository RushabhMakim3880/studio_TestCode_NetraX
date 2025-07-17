
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale } from 'lucide-react';

const globalReporting = [
    { country: 'India', agency: 'Cyber Crime Portal, CERT-In', website: 'cybercrime.gov.in, cert-in.org.in' },
    { country: 'USA', agency: 'FBI IC3', website: 'ic3.gov' },
    { country: 'UK', agency: 'Action Fraud', website: 'actionfraud.police.uk' },
    { country: 'Australia', agency: 'ACSC', website: 'cyber.gov.au' },
    { country: 'EU', agency: 'Europol EC3', website: 'europol.europa.eu' },
];

const evidenceCollection = [
    { type: 'Emails', method: 'Download headers, full email copy' },
    { type: 'Chat/DMs', method: 'Screenshots + export of conversations' },
    { type: 'Bank Transactions', method: 'Bank statements, SMS alerts, UPI screenshots' },
    { type: 'Web Evidence', method: 'Capture using tools like HTTrack, Wayback Machine' },
    { type: 'Device Logs', method: 'Collect logs using SIEM or OS logs' },
];

const itActSections = [
    { section: 'Section 43', offense: 'Unauthorized access, damage to computer systems' },
    { section: 'Section 66', offense: 'Hacking with criminal intent' },
    { section: 'Section 66C', offense: 'Identity theft (e.g., using stolen passwords)' },
    { section: 'Section 66D', offense: 'Impersonation and online fraud (phishing)' },
    { section: 'Section 67', offense: 'Publishing obscene material' },
    { section: 'Section 69', offense: 'Government powers to intercept data' },
    { section: 'Section 72', offense: 'Breach of confidentiality' },
    { section: 'Section 79', offense: 'Safe harbor provision for intermediaries' },
];

export function ComplianceAndLegalReference() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Scale className="h-6 w-6" />
            <CardTitle>Compliance & Legal Reference</CardTitle>
        </div>
        <CardDescription>A quick reference guide for cyber laws, reporting, and compliance standards.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">Reporting Protocols</AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Reporting in India</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>1. Cyber Crime Portal:</strong> File complaints at <a href="https://cybercrime.gov.in" target="_blank" className="text-accent underline">cybercrime.gov.in</a> (anonymously possible).</p>
                        <p><strong>2. Helpline:</strong> Call 1930 for immediate assistance.</p>
                        <p><strong>3. Local Cyber Cell:</strong> Visit the nearest police station to file an FIR, especially for financial fraud.</p>
                        <p><strong>4. CERT-In:</strong> Organizations must report breaches at <a href="https://www.cert-in.org.in" target="_blank" className="text-accent underline">cert-in.org.in</a>.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Global Reporting Mechanisms</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Agency</TableHead><TableHead>Website</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {globalReporting.map(item => (
                            <TableRow key={item.country}><TableCell>{item.country}</TableCell><TableCell>{item.agency}</TableCell><TableCell>{item.website}</TableCell></TableRow>
                        ))}
                        </TableBody></Table>
                    </CardContent>
                </Card>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">Digital Evidence Collection</AccordionTrigger>
            <AccordionContent className="pt-2">
                 <Table><TableHeader><TableRow><TableHead>Evidence Type</TableHead><TableHead>Collection Method</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {evidenceCollection.map(item => (
                        <TableRow key={item.type}><TableCell>{item.type}</TableCell><TableCell>{item.method}</TableCell></TableRow>
                    ))}
                    </TableBody></Table>
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">The IT Act 2000 (India)</AccordionTrigger>
            <AccordionContent className="pt-2">
                 <Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Offense / Provision</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {itActSections.map(item => (
                        <TableRow key={item.section}><TableCell>{item.section}</TableCell><TableCell>{item.offense}</TableCell></TableRow>
                    ))}
                    </TableBody></Table>
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">Global Cybersecurity Regulations</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <RegulationCard title="GDPR (EU)" description="Protects data privacy of EU citizens. Applies to any organization handling EU data. Fines up to 4% of global revenue.">
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Lawful basis for data collection</li>
                        <li>Right to be forgotten</li>
                        <li>Data breach notification within 72 hours</li>
                        <li>Data Protection Officer (DPO) required</li>
                    </ul>
                </RegulationCard>
                <RegulationCard title="HIPAA (USA)" description="Governs healthcare data security and privacy for hospitals, insurance, and medical apps.">
                     <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Administrative & Technical safeguards</li>
                        <li>Breach notification requirements</li>
                        <li>Requires audit controls and access logs</li>
                    </ul>
                </RegulationCard>
                <RegulationCard title="PCI DSS" description="Applicable to any organization handling card payments (Visa, MasterCard, etc.).">
                     <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Encrypt cardholder data</li>
                        <li>Regular vulnerability assessments</li>
                        <li>No storage of CVV</li>
                    </ul>
                </RegulationCard>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

const RegulationCard = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <Card className="bg-primary/20">
        <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
)
