import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurado" }, { status: 500 })
  }

  try {
    // Intentar listar modelos disponibles
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (!listResponse.ok) {
      const errorText = await listResponse.text()
      return NextResponse.json({
        error: "Error al listar modelos",
        status: listResponse.status,
        details: errorText
      }, { status: listResponse.status })
    }

    const modelsData = await listResponse.json()
    
    // También probar hacer una llamada de prueba con gemini-1.5-flash
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: "Hola, responde solo con 'OK'" }]
          }]
        })
      }
    )

    const testResult = testResponse.ok 
      ? { success: true, text: (await testResponse.json()).candidates?.[0]?.content?.parts?.[0]?.text }
      : { success: false, error: await testResponse.text() }

    return NextResponse.json({
      apiKeyConfigured: true,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      modelsAvailable: modelsData.models?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods
      })) || [],
      testCall: testResult
    })
  } catch (error: any) {
    return NextResponse.json({
      error: "Error al verificar Gemini",
      message: error.message
    }, { status: 500 })
  }
}

