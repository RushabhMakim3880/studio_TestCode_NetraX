
'use server';

import net from 'net';
import dns from 'dns/promises';
import { COMMON_PORTS } from '@/lib/ports';

export type PortScanResult = {
  port: number;
  status: 'open' | 'closed';
  service: string;
};

type ScanPortsOptions = {
    host: string;
    onProgress: (progress: number) => void;
    onResult: (result: PortScanResult) => void;
};

const BATCH_SIZE = 50; // Number of ports to scan concurrently

export async function scanPorts(options: ScanPortsOptions): Promise<void> {
    const { host, onProgress, onResult } = options;
    const portsToScan = Object.keys(COMMON_PORTS).map(Number);
    let ipAddress: string;

    try {
        // Resolve domain name to IP address
        ipAddress = (await dns.resolve(host))[0];
    } catch (error) {
        console.error(`DNS lookup failed for ${host}:`, error);
        throw new Error(`Could not resolve host: ${host}`);
    }

    let completedScans = 0;

    for (let i = 0; i < portsToScan.length; i += BATCH_SIZE) {
        const batch = portsToScan.slice(i, i + BATCH_SIZE);
        
        const promises = batch.map(port => {
            return new Promise<void>(resolve => {
                const socket = new net.Socket();
                socket.setTimeout(1500); // 1.5 seconds timeout

                socket.on('connect', () => {
                    onResult({ port, status: 'open', service: COMMON_PORTS[port] || 'unknown' });
                    socket.destroy();
                    resolve();
                });

                socket.on('timeout', () => {
                    // Timeout is treated as closed/filtered
                    socket.destroy();
                    resolve();
                });

                socket.on('error', (err) => {
                    // 'ECONNREFUSED' is a clear sign of a closed port.
                    // Other errors also mean it's not open.
                    socket.destroy();
                    resolve();
                });

                socket.connect(port, ipAddress);
            }).finally(() => {
                completedScans++;
                const progress = (completedScans / portsToScan.length) * 100;
                // Only send progress updates in larger chunks to avoid overwhelming the client
                if (completedScans % 10 === 0 || completedScans === portsToScan.length) {
                    onProgress(progress);
                }
            });
        });

        await Promise.all(promises);
    }
}
