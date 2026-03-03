'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('fiado')
  const [preview, setPreview] = useState<string>('')
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('imagem', file)
      formData.append('tipo', tipo)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro na API')
      }

      const data = await response.json()
      setResultado(data)
      toast.success('Imagem processada com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao processar imagem')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    if (!resultado?.dados) return

    setConfirmando(true)
    const supabase = createClient()

    if (tipo === 'fiado' && resultado.dados.cliente && resultado.dados.valor) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nome', `%${resultado.dados.cliente}%`)
        .single()

      if (cliente) {
        const { error } = await supabase.from('fiados_lancamentos').insert([
          {
            fiado_id: cliente.id,
            tipo: 'compra',
            valor: resultado.dados.valor,
            descricao: resultado.dados.descricao || 'OCR',
            origem: 'ocr',
          },
        ])

        if (error) {
          toast.error('Erro ao registrar fiado')
        } else {
          toast.success('Fiado registrado com sucesso!')
          setResultado(null)
          setFile(null)
          setPreview('')
        }
      } else {
        toast.error('Cliente não encontrado no sistema')
      }
    }

    setConfirmando(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0D2240] mb-6">Scanner OCR</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Tipo */}
        <Card>
          <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
          >
            <option value="fiado">📝 Fiado (Caderninho)</option>
            <option value="estoque">📦 Estoque (Inventário)</option>
            <option value="caixa">💰 Caixa (Recibos)</option>
            <option value="nf">📄 NF (Nota Fiscal)</option>
          </select>
        </Card>

        {/* Upload */}
        <Card>
          <label className="block text-sm font-medium mb-3">Selecione a Imagem</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            capture="environment"
            className="w-full"
          />
        </Card>

        {/* Preview */}
        {preview && (
          <Card>
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="relative w-full h-48 bg-gray-200 rounded">
              <Image src={preview} alt="Preview" fill className="object-contain" />
            </div>
          </Card>
        )}

        {/* Botão */}
        {file && (
          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            Processar Imagem
          </Button>
        )}
      </form>

      {/* Resultado */}
      {resultado && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Resultado da Extração</h2>

          {/* Texto Bruto */}
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2">Texto Extraído</h3>
            <div className="bg-gray-100 p-3 rounded text-xs max-h-32 overflow-y-auto whitespace-pre-wrap">
              {resultado.texto || 'Nenhum texto encontrado'}
            </div>
          </div>

          {/* Dados Estruturados */}
          {resultado.dados && tipo === 'fiado' && (
            <div className="mb-4 space-y-2">
              <h3 className="font-medium text-sm">Dados Estruturados</h3>
              {resultado.dados.cliente && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{resultado.dados.cliente}</span>
                </div>
              )}
              {resultado.dados.valor && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">R$ {resultado.dados.valor}</span>
                </div>
              )}
              {resultado.dados.data && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{resultado.dados.data}</span>
                </div>
              )}
              {resultado.dados.descricao && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descrição:</span>
                  <span className="font-medium">{resultado.dados.descricao}</span>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={handleConfirmar}
              className="flex-1"
              disabled={!resultado.dados || confirmando}
            >
              {confirmando ? 'Confirmando...' : '✓ Confirmar'}
            </Button>
            <Button
              size="md"
              variant="ghost"
              onClick={() => setResultado(null)}
              className="flex-1"
            >
              × Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
