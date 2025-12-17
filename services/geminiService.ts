
import { GoogleGenAI } from "@google/genai";

// Generate a product mockup using the Gemini 2.5 Flash Image model.
export const generateProductMockup = async (base64Image: string, prompt: string): Promise<string> => {
  // Always obtain the API key exclusively from process.env.API_KEY.
  // Create a new GoogleGenAI instance right before making an API call to ensure it uses the correct context.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-2.5-flash-image for image generation/editing tasks as per guidelines.
  const modelName = 'gemini-2.5-flash-image';

  const systemInstruction = `
    You are an elite Industrial Designer and CG Artist. 
    You will be provided with a rough sketch of a product and a descriptive prompt.
    Your task is to transform this rough sketch into a high-fidelity, photorealistic 3D render/mockup.
    IMPORTANT CONSTRAINTS:
    1. MAINTAIN PERSPECTIVE: Keep the exact same silhouette, structural lines, and perspective of the sketch.
    2. MATERIAL APPLICATION: Apply realistic materials, textures, and lighting as described in the prompt.
    3. PROFESSIONAL LIGHTING: Use studio lighting techniques (soft shadows, realistic reflections, depth of field).
    4. BACKGROUND: Place the product on a clean, professional minimalist studio background unless otherwise specified.
    5. QUALITY: Ensure 4K level detail in textures (brushed metal, carbon fiber, leather, glass, etc.).
  `;

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1], // Extract base64 data portion.
      mimeType: 'image/png',
    },
  };

  const textPart = {
    text: `Sketch: [Provided Image]. Product Description: ${prompt}. Goal: Create a photorealistic industrial design mockup.`,
  };

  try {
    // Call generateContent directly with model name and contents.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    let generatedImageUrl = '';

    // Iterate through candidates and parts to find the generated image, as per guidelines.
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          generatedImageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!generatedImageUrl) {
      throw new Error("The model did not return an image part in the response.");
    }

    return generatedImageUrl;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
