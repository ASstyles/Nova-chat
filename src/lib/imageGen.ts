import { ImageGenOptions, GeneratedImage } from '../types';
import { enhancePromptWithGemini } from './gemini';

export const ASPECT_RATIOS: Record<string, { width: number; height: number; label: string; ratioText: string }> = {
  '1:1': { width: 1024, height: 1024, label: 'Square (1:1)', ratioText: '1:1' },
  '16:9': { width: 1280, height: 720, label: 'Landscape (16:9)', ratioText: '16:9' },
  '9:16': { width: 720, height: 1280, label: 'Portrait (9:16)', ratioText: '9:16' },
  '4:3': { width: 1024, height: 768, label: 'Classic (4:3)', ratioText: '4:3' },
  '21:9': { width: 1344, height: 576, label: 'Ultra-wide (21:9)', ratioText: '21:9' },
};

export const ART_STYLES = [
  { id: 'none', name: 'Raw / Natural', prefix: '' },
  { id: 'photorealistic', name: 'Photorealistic 📸', prefix: 'Ultra-photorealistic 8k photo, sharp focus, professional studio lighting, 35mm lens, RAW camera quality,' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon 🏙️', prefix: 'Vibrant cyberpunk style, glowing neon lights, futuristic city reflections, dark rainy atmosphere, high tech aesthetic,' },
  { id: 'anime', name: 'Anime / Manga 🌸', prefix: 'Masterpiece anime illustration, Makoto Shinkai style, vibrant colors, detailed line art, stunning lighting,' },
  { id: 'digital-art', name: 'Digital Art 🎨', prefix: 'Epic fantasy digital painting, ArtStation trending, intricate details, dramatic lighting, rich color palette,' },
  { id: '3d-render', name: '3D Render 💎', prefix: 'Unreal Engine 5 render, Octane render quality, volumetric lighting, raytracing reflections, hyper detailed 3D,' },
  { id: 'synthwave', name: 'Synthwave 80s 🌇', prefix: 'Retro 1980s synthwave aesthetic, neon grid, sunset horizon, chrome details, purple and magenta glow,' },
  { id: 'cinematic', name: 'Cinematic Movie 🎬', prefix: 'Cinematic film shot, anamorphic lens flare, moody color grading, dramatic depth of field, IMAX quality,' },
  { id: 'fantasy', name: 'Fantasy Magic 🐉', prefix: 'Ethereal fantasy art, glowing magical runes, mythical atmosphere, mystical particles, enchanting soft lighting,' },
  { id: 'pixel-art', name: 'Pixel Art 👾', prefix: 'Detailed 16-bit pixel art style, vibrant nostalgic palette, retro game asset aesthetic,' }
];

export async function generateImage(options: ImageGenOptions): Promise<GeneratedImage> {
  const { prompt, negativePrompt, aspectRatio = '1:1', style = 'none', model = 'flux', enhancePrompt = false } = options;

  let finalPrompt = prompt.trim();
  let enhancedPromptText: string | undefined;

  // Enhance prompt with Gemini if requested
  if (enhancePrompt) {
    try {
      enhancedPromptText = await enhancePromptWithGemini(finalPrompt);
      if (enhancedPromptText) {
        finalPrompt = enhancedPromptText;
      }
    } catch (e) {
      console.warn("Prompt enhancement skipped:", e);
    }
  }

  // Apply style prefix
  const styleObj = ART_STYLES.find(s => s.id === style);
  if (styleObj && styleObj.prefix) {
    finalPrompt = `${styleObj.prefix} ${finalPrompt}`;
  }

  if (negativePrompt?.trim()) {
    finalPrompt = `${finalPrompt} --no ${negativePrompt.trim()}`;
  }

  const dim = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['1:1'];
  const seed = options.seed || Math.floor(Math.random() * 1000000);

  // Pollinations FLUX engine URL
  const modelParam = model === 'anime' ? 'anime' : model === 'flux-realism' ? 'any-dark' : 'flux';
  const encodedPrompt = encodeURIComponent(finalPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dim.width}&height=${dim.height}&seed=${seed}&nologo=true&model=${modelParam}`;

  // Pre-fetch image to ensure ready & cached
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Image service HTTP error ${res.status}`);
    }
  } catch (e) {
    console.warn("Direct fetch check warning:", e);
  }

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    prompt: prompt,
    enhancedPrompt: enhancedPromptText,
    url: imageUrl,
    aspectRatio: aspectRatio,
    style: style,
    seed: seed,
    model: model,
    createdAt: Date.now()
  };
}
