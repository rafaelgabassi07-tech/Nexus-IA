import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
async function main() {
  const models = await ai.models.list();
  for (const model of models) {
    if (model.name.includes("gemini")) {
      console.log(model.name);
    }
  }
}
main();
