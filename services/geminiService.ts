import { GoogleGenAI, SchemaType, Type, LiveServerMessage, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Regular Chat & Correction ---

export const generateCorrection = async (userText: string) => {
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: userText,
    config: {
      systemInstruction: `You are a helpful English teacher for children. 
      Analyze the user's input.
      1. If the input is in a language other than English, translate it to English (this is the "corrected" version).
      2. If the input is English but has grammar/spelling mistakes, correct it.
      3. If the input is perfect English, the "corrected" version is the same as original.
      4. Provide a very brief, friendly explanation of the grammar rule or translation.
      5. Provide a natural conversational reply to keep the chat going.
      
      Return JSON only.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          corrected: { type: Type.STRING },
          explanation: { type: Type.STRING },
          reply: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateQuiz = async (topic: string) => {
  const model = "gemini-2.5-flash";
  const response = await ai.models.generateContent({
    model,
    contents: `Create 5 simple multiple choice questions for a child learning English about: ${topic}. JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateStoryActivity = async () => {
    const model = "gemini-2.5-flash";
    const prompt = `Tell a creative, engaging English story for students.
    
    Requirements:
    1. Length: Moderate length (3 to 5 paragraphs). Not too short, not too long.
    2. Content: Interesting themes (adventure, friendship, mystery, science). Simple but descriptive English.
    3. Questions: Generate exactly 10 multiple-choice comprehension questions based on the story.
    
    Ensure the story is different every time.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateGrammarActivity = async (level: string, topic: string) => {
    const model = "gemini-2.5-flash";
    const prompt = `Create a comprehensive grammar lesson and a practice quiz.
    Target Audience Level: ${level}.
    Topic: ${topic}.
    
    Requirements:
    1. Lesson Content: A clear, engaging, friendly explanation of the grammar rule with 3 distinct examples.
    2. Quiz: Generate exactly 15 unique multiple-choice questions. 
       - The questions must be different from any previous typical examples.
       - Mix of fill-in-the-blanks and error identification.
       - Make them fun and related to daily life, stories, or interesting facts.
    
    The explanation for each question must explain WHY the correct answer is right.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    lesson: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING, description: "The main explanation of the rule. Write it like a script for a teacher to read aloud." },
                            examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of example sentences." }
                        }
                    },
                    quiz: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING, description: "The exact string of the correct option" },
                                explanation: { type: Type.STRING, description: "Explanation to show if the user gets it wrong." }
                            }
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
};

// --- Reading Time ---

export const generateReadingLesson = async () => {
    const model = "gemini-2.5-flash";
    const prompt = `Create content for an English Reading Class.
    
    Part 1: Phonics & Instructions.
    Provide 3 key "Sound Rules" or pronunciation tips (e.g., "The Magic E", "Th sound").
    
    Part 2: Reading Passage.
    Write a long, engaging story for reading practice.
    - MUST be at least 5 to 10 paragraphs long.
    - Approx 1-2 pages of text.
    - Clear, descriptive English.
    
    Return JSON.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    phonicsRules: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                ruleName: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                                exampleWord: { type: Type.STRING }
                            }
                        }
                    },
                    story: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING, description: "The full text of the story, at least 5 paragraphs." }
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
}

// --- Live API Helpers ---

export const getLiveClient = () => {
    return ai.live;
};

// Audio utils for Live API
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function convertAudioBufferToPCM(audioBuffer: AudioBuffer): Promise<Int16Array> {
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    const renderedBuffer = await offlineCtx.startRendering();
    const float32Data = renderedBuffer.getChannelData(0);
    
    const int16Data = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Data;
}