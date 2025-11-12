import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to decode HTML entities (e.g., &deg; to °, &nbsp; to space)
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&deg;': '°',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾',
    '&times;': '×',
    '&divide;': '÷',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  
  // Handle numeric entities like &#176; or &#xB0;
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

// Helper function to extract minutes from ISO 8601 duration (e.g., "PT30M" or "PT1H30M")
function extractMinutes(duration: string | null | undefined): number | null {
  if (!duration) return null;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  return hours * 60 + minutes;
}

// Helper function to extract instructions and split by sentence
function extractInstructions(instructions: any): string[] {
  if (!instructions) return [];
  
  let allText = '';
  
  if (Array.isArray(instructions)) {
    // Handle HowToStep array
    allText = instructions
      .map((step: any) => step.text || step)
      .join(' ');
  } else if (typeof instructions === 'string') {
    allText = instructions;
  }
  
  // Split by sentence (. followed by space or end of string)
  const sentences = allText
    .split(/\.\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.endsWith('.') ? s : s + '.');
  
  return sentences;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch the recipe page content
    const pageResponse = await fetch(url);
    const html = await pageResponse.text();

    // Use AI to extract recipe data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a recipe data extraction assistant. Extract recipe information from HTML and return it in valid JSON format with these fields: name (string), imageUrl (string - the main recipe image URL), servings (string), prepTime (ISO 8601 duration like PT30M or PT1H30M), cookTime (ISO 8601 duration), ingredients (array of strings), instructions (string or array of strings). If any field is not found, use null for strings or empty array for arrays.'
          },
          {
            role: 'user',
            content: `Extract the recipe data from this HTML:\n\n${html.substring(0, 15000)}`
          }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let recipeData;
    try {
      recipeData = JSON.parse(content);
    } catch (e) {
      // If the response is not valid JSON, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse recipe data');
      }
    }

    // Normalize the data and decode HTML entities
    const result = {
      name: recipeData.name ? decodeHtmlEntities(recipeData.name) : null,
      imageUrl: recipeData.imageUrl || recipeData.imageURL || null,
      servings: recipeData.servings ? decodeHtmlEntities(recipeData.servings) : null,
      prepTime: extractMinutes(recipeData.prepTime),
      cookTime: extractMinutes(recipeData.cookTime),
      ingredients: (recipeData.ingredients || []).map((ing: string) => decodeHtmlEntities(ing)),
      instructions: extractInstructions(recipeData.instructions).map((inst: string) => decodeHtmlEntities(inst)),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyse-recipe function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
