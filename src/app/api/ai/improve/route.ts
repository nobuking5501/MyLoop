import { NextRequest, NextResponse } from 'next/server'
import { improveMessage } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originalMessage, instruction } = body

    if (!originalMessage || !instruction) {
      return NextResponse.json(
        { error: 'originalMessage and instruction are required' },
        { status: 400 }
      )
    }

    const improvedMessage = await improveMessage(originalMessage, instruction)

    return NextResponse.json({ message: improvedMessage })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to improve message' },
      { status: 500 }
    )
  }
}
