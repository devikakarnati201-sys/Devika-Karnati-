import { GoogleGenAI } from "@google/genai";

let aiClient: any = null;

function getAiClient() {
  if (aiClient) return aiClient;
  
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else if ((window as any).process?.env?.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: (window as any).process.env.GEMINI_API_KEY });
  }
  
  return aiClient;
}

export interface WisdomStats {
  todayStudyTime: number;
  pendingHomework: number;
  completedTasksToday: number;
}

export async function generateDailyWisdom(stats: WisdomStats): Promise<string> {
  const today = new Date().toDateString();
  const ai = getAiClient();
  if (!ai) {
    console.warn("Gemini API key not found. Using default wisdom.");
    return "Progress is quiet. Consistency is loud.";
  }
  const cachedWisdom = localStorage.getItem('academia_daily_wisdom');
  const cachedDate = localStorage.getItem('academia_wisdom_date');

  // If we have a cached wisdom for today, return it
  if (cachedWisdom && cachedDate === today) {
    return cachedWisdom;
  }

  try {
    const prompt = `
      You are an academic mentor for a student. 
      Generate a short, impactful, vintage-style quote (10-15 words) based on the student's current stats:
      - Study time today: ${stats.todayStudyTime} minutes
      - Pending homework: ${stats.pendingHomework}
      - Tasks completed today: ${stats.completedTasksToday}

      Guidelines:
      - If study time is high, be approving and scholarly.
      - If study time is low, be encouraging but firm about discipline.
      - If homework is piling up, mention "the weight of the ledger" or similar academic vintage imagery.
      - Use sophisticated, "ink-and-paper" era language (e.g., discipline, consistency, the mind, the academy).
      - Do not use markdown formatting. Just the quote in plain text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const wisdom = response.text?.replace(/"/g, '').trim() || "Progress is quiet. Consistency is loud.";
    
    // Cache the result
    localStorage.setItem('academia_daily_wisdom', wisdom);
    localStorage.setItem('academia_wisdom_date', today);

    return wisdom;
  } catch (error) {
    console.error("Error generating wisdom:", error);
    return "Progress is quiet. Consistency is loud.";
  }
}
