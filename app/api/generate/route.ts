import { NextResponse } from 'next/server';
import { auth, currentUser } from "@clerk/nextjs/server";

import { sql } from '@vercel/postgres';
import { GoogleGenerativeAI } from "@google/generative-ai";


export async function POST(req: Request) {
  try {
    // 1. Check Login
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) return NextResponse.json({ error: "No image" }, { status: 400 });

    // 2. Convert Image for Gemini
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    // 3. Check User History (The Learning Part)
    // We try to find their last 3 requests to understand their style
    let pastContext = "";
    try {
        const history = await sql`
          SELECT user_preferences FROM user_history 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC LIMIT 3
        `;
        pastContext = history.rows.map(row => row.user_preferences).join("; ");
    } catch (e) {
        console.log("No history found yet.");
    }

    // 4. Send to Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const finalPrompt = `
      You are a professional lighting designer.
      User's Past Style: [${pastContext}]
      Current Request: ${prompt}
      
      Task: Analyze the architecture in this image. Suggest a lighting design plan.
      If the user has a specific style in their history, try to match it.
    `;
    
    const result = await model.generateContent([
      finalPrompt, 
      { inlineData: { data: base64String, mimeType: imageFile.type } }
    ]);
    const aiResponse = result.response.text();

    // 5. Save the Result to "Memory"
    try {
      // We save a summary of what they asked for and what they got
      await sql`
        INSERT INTO user_history (user_id, user_preferences)
        VALUES (${userId}, ${`Request: ${prompt} -> Style used: ${aiResponse.substring(0, 50)}...`})
      `;
    } catch (e) {
      console.log("Database save failed (table might not exist yet)");
    }

    return NextResponse.json({ success: true, result: aiResponse });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
