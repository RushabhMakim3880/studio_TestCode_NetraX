
'use server';
/**
 * @fileOverview A flow for simulating C2 agent check-ins.
 * This has been updated to generate mock data locally to avoid API quota issues.
 *
 * - getC2Checkins - Returns a list of simulated active C2 agents.
 * - C2CheckinOutput - The return type for the getC2Checkins function.
 */

import { z } from 'zod';

const AgentSchema = z.object({
  agentId: z.string().describe('A unique identifier for the agent (e.g., a short hash).'),
  externalIp: z.string().describe('The public IP address of the compromised host. Must be a valid IPv4 or IPv6 address.'),
  internalIp: z.string().describe('The private IP address of the compromised host. Must be a valid IPv4 or IPv6 address.'),
  hostname: z.string().describe('The hostname of the compromised machine.'),
  user: z.string().describe('The user account the agent is running as (e.g., "corp\\j.smith", "root").'),
  processName: z.string().describe('The name of the process the agent is running in (e.g., "svchost.exe", "rundll32.exe").'),
  lastSeen: z.string().describe('How long ago the agent last checked in (e.g., "32s ago", "5m ago").'),
  os: z.string().describe('The operating system of the host (e.g., "Windows 11", "Ubuntu 22.04").'),
});

const C2CheckinOutputSchema = z.object({
  agents: z.array(AgentSchema).describe('A list of 3-5 active C2 agents.'),
});
export type C2CheckinOutput = z.infer<typeof C2CheckinOutputSchema>;


// --- Mock Data Generation ---
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomHash = (length = 8) => crypto.randomUUID().substring(0, length);

const MOCK_DATA = {
    hostnames: ['WEB-SRV-01', 'DC-01', 'FIN-PC-12', 'DEV-UBUNTU-04', 'MARKETING-MAC'],
    users: ['corp\\a.jones', 'svc_iis', 'root', 'finance\\b.davis', 'devops'],
    processes: ['svchost.exe', 'powershell.exe', '/bin/bash', 'rundll32.exe', 'sshd'],
    os: ['Windows Server 2022', 'Windows 11', 'Ubuntu 22.04', 'Debian 11', 'macOS Sonoma'],
    externalIps: ['203.0.113.58', '198.51.100.22', '192.0.2.144', '203.0.113.101', '198.51.100.73'],
};

/**
 * Generates a list of simulated C2 agents locally without calling an AI model.
 */
export async function getC2Checkins(): Promise<C2CheckinOutput> {
    const numAgents = randomInt(3, 5);
    const agents: z.infer<typeof AgentSchema>[] = [];

    for (let i = 0; i < numAgents; i++) {
        agents.push({
            agentId: randomHash(),
            externalIp: getRandomElement(MOCK_DATA.externalIps),
            internalIp: `10.1.${randomInt(10, 50)}.${randomInt(10, 200)}`,
            hostname: getRandomElement(MOCK_DATA.hostnames),
            user: getRandomElement(MOCK_DATA.users),
            processName: getRandomElement(MOCK_DATA.processes),
            lastSeen: `${randomInt(2, 59)}s ago`,
            os: getRandomElement(MOCK_DATA.os),
        });
    }

    // Use a timeout to simulate a network delay, so the loading spinner is visible.
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { agents };
}
