import { NextRequest, NextResponse } from 'next/server'
import { extrairTextoImagem, parsearFiado } from '@/lib/ocr/vision'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('imagem') as File
    const tipo = formData.get('tipo') as string

    if (!file || !tipo) {
      return NextResponse.json(
        { error: 'Imagem e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const textoOCR = await extrairTextoImagem(base64)

    let dadosEstruturados = null
    if (tipo === 'fiado') {
      dadosEstruturados = await parsearFiado(textoOCR)
    }

    return NextResponse.json({
      texto: textoOCR,
      dados: dadosEstruturados,
      tipo,
    })
  } catch (error) {
    console.error('Erro no OCR:', error)
    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    )
  }
}
