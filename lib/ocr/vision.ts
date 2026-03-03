export async function extrairTextoImagem(imageBase64: string): Promise<string> {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          }],
        }),
      }
    )
    const data = await response.json()
    return data.responses?.[0]?.fullTextAnnotation?.text || ''
  } catch (error) {
    console.error('Erro ao extrair texto:', error)
    return ''
  }
}

export async function parsearFiado(textoOCR: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é um sistema de extração de dados de caderninho de fiado de bar.
Extraia do texto abaixo os campos: cliente (nome), valor (número), data (YYYY-MM-DD), descricao.
Retorne APENAS JSON válido no formato: {"cliente": "", "valor": 0, "data": "", "descricao": ""}
Se não encontrar um campo, use null.

Texto: ${textoOCR}`
            }]
          }]
        }),
      }
    )
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    } catch {
      return null
    }
  } catch (error) {
    console.error('Erro ao parsear fiado:', error)
    return null
  }
}
