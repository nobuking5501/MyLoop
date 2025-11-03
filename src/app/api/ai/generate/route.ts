import { NextRequest, NextResponse } from 'next/server'
import { generateMessage, MessageGenerationParams } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params: MessageGenerationParams = {
      purpose: body.purpose,
      tone: body.tone || 'friendly',
      length: body.length || 'medium',
      context: body.context,
      targetAudience: body.targetAudience,
    }

    const message = await generateMessage(params)

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate message' },
      { status: 500 }
    )
  }
}
