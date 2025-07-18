
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale } from 'lucide-react';
import Link from 'next/link';

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

const ipcSections = [
    { section: '419', offense: 'Cheating by personation (e.g., social media fraud)' },
    { section: '420', offense: 'Cheating and dishonestly inducing delivery of property' },
    { section: '463-466', offense: 'Forgery and digital document tampering' },
    { section: '500-509', offense: 'Online defamation and abuse' },
];

const isoControls = [
    { control: 'A.5', description: 'Information Security policies' },
    { control: 'A.6', description: 'Organization of information security' },
    { control: 'A.9', description: 'Access control' },
    { control: 'A.12', description: 'Operations security' },
    { control: 'A.14', description: 'System acquisition, development, maintenance' },
    { control: 'A.18', description: 'Compliance' },
];

const pdcaCycle = [
    { phase: 'Plan', activities: 'Identify risks, define security policies, and establish controls.' },
    { phase: 'Do', activities: 'Implement the policies, procedures, and tools defined in the planning phase.' },
    { phase: 'Check', activities: 'Monitor, audit, and test the implemented controls to ensure they are effective.' },
    { phase: 'Act', activities: 'Improve the ISMS based on feedback, audit results, and changing threat landscape.' },
];

const keyRoles = [
    { role: 'CERT-In', description: 'The national nodal agency in India for coordinating responses to cybersecurity incidents.' },
    { role: 'DPO', description: 'Data Protection Officer, a role mandated by GDPR for certain organizations to oversee data protection strategy.' },
    { role: 'Auditors', description: 'Internal or external personnel who assess and verify compliance with standards like ISO, PCI DSS, etc.' },
]

export function ComplianceAndLegalReference() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Scale className="h-6 w-6" />
            <CardTitle>Compliance &amp; Legal Reference</CardTitle>
        </div>
        <CardDescription>A quick reference guide for cyber laws, reporting, and compliance standards.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">Reporting Protocols</AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Reporting in India</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>1. Cyber Crime Portal:</strong> File complaints at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-accent underline">cybercrime.gov.in</a> (anonymously possible).</p>
                        <p><strong>2. Helpline:</strong> Call 1930 for immediate assistance.</p>
                        <p><strong>3. Local Cyber Cell:</strong> Visit the nearest police station to file an FIR, especially for financial fraud.</p>
                        <p><strong>4. CERT-In:</strong> Organizations must report breaches at <a href="https://www.cert-in.org.in" target="_blank" rel="noopener noreferrer" className="text-accent underline">cert-in.org.in</a>.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Global Reporting Mechanisms</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Agency</TableHead><TableHead>Website</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {globalReporting.map(item => (
                            <TableRow key={item.country}><TableCell>{item.country}</TableCell><TableCell>{item.agency}</TableCell><TableCell><a href={`https://${item.website}`} target="_blank" rel="noopener noreferrer" className="text-accent underline">{item.website}</a></TableCell></TableRow>
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
          <AccordionItem value="item-ipc">
            <AccordionTrigger className="text-lg">IPC Sections Relevant to Cybercrime (India)</AccordionTrigger>
            <AccordionContent className="pt-2">
                 <Table><TableHeader><TableRow><TableHead>IPC Section</TableHead><TableHead>Cyber Relevance</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {ipcSections.map(item => (
                        <TableRow key={item.section}><TableCell>{item.section}</TableCell><TableCell>{item.offense}</TableCell></TableRow>
                    ))}
                    </TableBody></Table>
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">Global Cybersecurity Regulations</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <RegulationCard title="GDPR (EU)" description="Protects data privacy of EU citizens. Applies to any organization handling EU data. Fines up to 4% of global revenue." url="https://gdpr-info.eu/">
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Lawful basis for data collection</li>
                        <li>Right to be forgotten</li>
                        <li>Data breach notification within 72 hours</li>
                        <li>Data Protection Officer (DPO) required for many organizations</li>
                    </ul>
                </RegulationCard>
                <RegulationCard title="HIPAA (USA)" description="Governs healthcare data security and privacy for hospitals, insurance, and medical apps." url="https://www.hhs.gov/hipaa/index.html">
                     <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Administrative, Physical, and Technical safeguards</li>
                        <li>Breach notification requirements</li>
                        <li>Requires audit controls and access logs</li>
                    </ul>
                </RegulationCard>
                <RegulationCard title="PCI DSS" description="Applicable to any organization handling card payments (Visa, MasterCard, etc.)." url="https://www.pcisecuritystandards.org/">
                     <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Encrypt cardholder data in transit and at rest</li>
                        <li>No storage of sensitive authentication data (e.g., CVV)</li>
                        <li>Regular vulnerability assessments and penetration testing</li>
                    </ul>
                </RegulationCard>
                 <RegulationCard title="DMCA (USA)" description="Protects copyright in the digital space, addressing piracy and illegal content distribution." url="https://www.copyright.gov/dmca/">
                     <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>Allows copyright holders to issue takedown notices to ISPs</li>
                        <li>Provides "safe harbor" for platforms that comply with takedown requests</li>
                    </ul>
                </RegulationCard>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg">ISO/IEC 27001 &amp; ISMS</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
                <p className="text-sm text-muted-foreground">ISO/IEC 27001 is the leading international standard for an Information Security Management System (ISMS), focusing on Confidentiality, Integrity, and Availability (CIA triad).</p>
                <Card>
                    <CardHeader><CardTitle className="text-base">Key Controls (Annex A)</CardTitle></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Control</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {isoControls.map(item => (
                            <TableRow key={item.control}><TableCell>{item.control}</TableCell><TableCell>{item.description}</TableCell></TableRow>
                        ))}
                        </TableBody></Table>
                    </CardContent>
                </Card>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg">ISMS Lifecycle (PDCA Model)</AccordionTrigger>
            <AccordionContent className="pt-2">
                 <Table><TableHeader><TableRow><TableHead>Phase</TableHead><TableHead>Activities</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {pdcaCycle.map(item => (
                        <TableRow key={item.phase}><TableCell>{item.phase}</TableCell><TableCell>{item.activities}</TableCell></TableRow>
                    ))}
                    </TableBody></Table>
            </AccordionContent>
          </AccordionItem>
           <AccordionItem value="item-7" className="border-b-0">
            <AccordionTrigger className="text-lg">Key Roles in Cybersecurity</AccordionTrigger>
            <AccordionContent className="pt-2">
                 <Table><TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {keyRoles.map(item => (
                        <TableRow key={item.role}><TableCell>{item.role}</TableCell><TableCell>{item.description}</TableCell></TableRow>
                    ))}
                    </TableBody></Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

const RegulationCard = ({ title, description, url, children }: { title: string, description: string, url: string, children: React.ReactNode }) => (
    <Card className="bg-primary/20">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <Link href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline text-xs whitespace-nowrap">Learn More</Link>
            </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
)
