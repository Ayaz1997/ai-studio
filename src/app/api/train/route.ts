import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Allow longer execution time if deployed

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

function parseBase64ToPart(dataUri: string) {
    const [header, base64] = dataUri.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    return {
        inlineData: {
            data: base64,
            mimeType,
        }
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { styleImages, trainingInstruction } = body;

        if (!styleImages || !Array.isArray(styleImages) || styleImages.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing style images' }, { status: 400 });
        }

        const ai = getAi();

        const systemPrompt = `You are an expert art director and style analyst. Your task is to analyze the following images and extract a highly detailed, comprehensive textual description of their SHARED visual style. 

        CRITICAL RULES:
        1. COMPLETELY IGNORE the subjects, objects, or people in the images (e.g., if the images are of cars, do not mention cars).
        2. EXTRACT the EXACT color palette (use specific color names), precise lighting, textural details, and artistic techniques.
        3. DO NOT hallucinate "glass", "glossy", "3D", or "plastic" aesthetics unless they are undeniably the central style of every provided image.
        4. If there are custom user instructions, incorporate them heavily into the stylistic definition: "${trainingInstruction || 'None provided.'}"

Return ONLY the raw descriptive text detailing the style, optimized for a diffusion/generation prompt suffix. Make it punchy, descriptive, and highly specific to the visual execution.`;

        const contents = [
            ...styleImages.map(parseBase64ToPart),
            { text: systemPrompt }
        ];

        const response = await ai.models.generateContent({
            // We use standard conversational context model to describe the style
            model: 'gemini-3.1-pro-preview',
            contents: contents,
        });

        if (!response.text) {
            return NextResponse.json({ success: false, error: 'AI failed to generate a descriptor.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, descriptor: response.text });
    } catch (e: unknown) {
        console.error("Gemini Training Error:", e);
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
