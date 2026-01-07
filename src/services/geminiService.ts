// Gemini Service - lightweight REST client using Google Generative Language API
// Uses Vite env var: VITE_GOOGLE_API_KEY

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

async function request(prompt: string, context?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  if (!apiKey) {
    return 'Gemini API key is not configured. Please set VITE_GOOGLE_API_KEY.';
  }

  const inputText = context ? `Context: ${context}\n\nUser: ${prompt}` : prompt;

  try {
    const res = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: inputText }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', errText);
      return 'Gemini API request failed. Please try again later.';
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n');
    return text || 'No response from Gemini.';
  } catch (error) {
    console.error('Gemini request error:', error);
    return 'Unable to reach Gemini service. Please check your connection.';
  }
}

export const geminiService = {
  async chat(prompt: string, context?: string): Promise<string> {
    return await request(prompt, context);
  },
};
