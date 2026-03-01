import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Allow longer execution time for generation if deployed to Vercel

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

function parseBase64ToPart(dataUri: string) {
    // Format: data:image/png;base64,iVBORw...
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
        const { styleDescriptor, referenceImage, instruction, modelName, aspectRatio } = body;

        console.log("Generating with descriptor: " + styleDescriptor);

        if (!styleDescriptor || !referenceImage || !modelName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const ai = getAi();
        const prompt = `You are a strict and precise style transfer system. 
You will be provided with a reference image. 
Your singular goal is to REDRAW the exact structural subject matter of the reference image perfectly, but execute it entirely in the following artistic style:

STYLE DEFINITION:
${styleDescriptor}

CRITICAL RULES:
1. DO NOT change the core subject or structural composition of the reference image. Let the reference image strictly guide your output.
2. DO NOT add new objects, people, or items that are not in the reference image.
3. DO NOT apply glossy, glass, or 3D effects unless explicitly stated in the style definition.
4. If the instruction below is "Strictly maintain structural adherence without adding elements.", you must treat the reference image as sacred geometry and only change the textures/colors to match the style.
5. Apply the precise colors requested in the style definition. Keep the requested Aspect Ratio: ${aspectRatio || '1:1'}.
6. Custom Instruction: "${instruction || 'Strictly maintain structural adherence without adding elements.'}"
`;

        const contents = [
            parseBase64ToPart(referenceImage),
            { text: prompt }
        ];

        // Call Gemini generateContent (using the requested image prefix model)
        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            // Configure response depending on the modality. Assuming IMAGE modality is supported.
        });

        // Check if the response returned any inlineData (images)
        let outputImageBase64 = null;
        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content?.parts || [];
            // Try to find an image part
            for (const part of parts) {
                if (part.inlineData) {
                    outputImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }

        // If no image is natively returned via parts, we will just return a placeholder or error for MVP 
        // because the user's specific API behavior for "gemini-3.1-flash-image-preview" might differ.
        // If it's pure text output, return the text, but the intention is Image generation.
        if (!outputImageBase64) {
            console.log("No image returned. Response text:", response.text);
            return NextResponse.json({ success: true, text: response.text, fallbackImage: true });
        }

        return NextResponse.json({ success: true, image: outputImageBase64 });
    } catch (e: unknown) {
        console.error("Gemini Error:", e);
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
