
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ollamaUrl, model } = await req.json();

    if (!ollamaUrl) {
        return NextResponse.json({ success: false, message: 'Ollama URL is missing in the request.' }, { status: 400 });
    }

    // Forward the request from our server to the local Ollama server
    const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!ollamaResponse.ok) {
        // The server-side fetch won't be blocked by CORS, so we can get real status codes
        const errorText = await ollamaResponse.text();
        return NextResponse.json({ success: false, message: `Ollama API returned status ${ollamaResponse.status}. Is it running? Details: ${errorText}` }, { status: 200 });
    }
    
    const ollamaData = await ollamaResponse.json();
    const hasModel = ollamaData.models.some((m: any) => m.name.startsWith(model));
    
    if (!hasModel) {
        return NextResponse.json({ success: false, message: `Ollama is running, but model '${model}' was not found.` }, { status: 200 });
    }
    
    return NextResponse.json({ success: true, message: "Successfully connected to Ollama and model is available." }, { status: 200 });

  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        // This often catches network errors if the localhost URL isn't reachable from the server
        errorMessage = `Failed to connect to the Ollama server at the specified URL. Please ensure it is running and accessible. Error: ${error.message}`;
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
