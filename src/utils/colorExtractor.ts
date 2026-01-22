/**
 * Extract dominant color from an image URL using Canvas API
 */
export const extractDominantColor = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('16, 185, 129'); // Default emerald fallback
          return;
        }

        // Use smaller size for faster processing
        canvas.width = 100;
        canvas.height = 100;
        
        ctx.drawImage(img, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // Sample colors and find dominant hue
        const colorCounts: { [key: string]: number } = {};
        let maxCount = 0;
        let dominantColor = '';
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent or very dark/light pixels
          if (a < 125 || (r + g + b) < 50 || (r + g + b) > 650) continue;
          
          // Group similar colors by rounding to nearest 32
          const roundedR = Math.round(r / 32) * 32;
          const roundedG = Math.round(g / 32) * 32;
          const roundedB = Math.round(b / 32) * 32;
          
          const colorKey = `${roundedR},${roundedG},${roundedB}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          
          if (colorCounts[colorKey] > maxCount) {
            maxCount = colorCounts[colorKey];
            dominantColor = colorKey;
          }
        }
        
        if (dominantColor) {
          // Enhance saturation slightly for better visual effect
          const [r, g, b] = dominantColor.split(',').map(Number);
          const enhancedColor = enhanceSaturation(r, g, b);
          resolve(enhancedColor);
        } else {
          resolve('16, 185, 129'); // Default emerald fallback
        }
      } catch (error) {
        console.error('Error extracting color:', error);
        resolve('16, 185, 129'); // Default emerald fallback
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
      resolve('16, 185, 129'); // Default emerald fallback
    };
    
    img.src = imageUrl;
  });
};

/**
 * Enhance saturation of RGB color for more vibrant backgrounds
 */
const enhanceSaturation = (r: number, g: number, b: number): string => {
  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  
  if (max === min) {
    return `${r}, ${g}, ${b}`; // Grayscale, don't enhance
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  if (max === rNorm) {
    h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
  } else if (max === gNorm) {
    h = ((bNorm - rNorm) / d + 2) / 6;
  } else {
    h = ((rNorm - gNorm) / d + 4) / 6;
  }
  
  // Boost saturation by 20% but cap at 0.7 to avoid oversaturation
  const enhancedS = Math.min(s * 1.2, 0.7);
  
  // Keep lightness slightly darker for background
  const enhancedL = Math.max(l * 0.4, 0.15);
  
  // Convert back to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    if (s === 0) {
      const gray = Math.round(l * 255);
      return [gray, gray, gray];
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    const rOut = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const gOut = Math.round(hue2rgb(p, q, h) * 255);
    const bOut = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return [rOut, gOut, bOut];
  };
  
  const [rOut, gOut, bOut] = hslToRgb(h, enhancedS, enhancedL);
  return `${rOut}, ${gOut}, ${bOut}`;
};

