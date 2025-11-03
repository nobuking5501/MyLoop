/**
 * Google Sheets Sync Module
 * 顧客情報をスプレッドシートに同期
 */

import { Contact, Event } from '@/types/firestore'

interface SheetsConfig {
  spreadsheetId: string
  accessToken: string
}

/**
 * コンタクトをスプレッドシートに追加
 */
export async function syncContactToSheets(
  contact: Contact & { id: string },
  config: SheetsConfig
): Promise<void> {
  try {
    const row = [
      contact.id,
      contact.name || '',
      contact.email || '',
      contact.phone || '',
      contact.lineId || '',
      contact.tags.join(', '),
      contact.status,
      contact.createdAt.toDate().toISOString(),
    ]

    // Google Sheets API呼び出し
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/contacts!A:H:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`)
    }

    console.log(`Contact synced to Sheets: ${contact.id}`)
  } catch (error) {
    console.error('Failed to sync contact to Sheets:', error)
    throw error
  }
}

/**
 * 予約をスプレッドシートに追加
 */
export async function syncEventToSheets(
  event: Event & { id: string },
  config: SheetsConfig
): Promise<void> {
  try {
    const row = [
      event.id,
      event.type,
      event.title,
      event.start.toDate().toISOString(),
      event.end.toDate().toISOString(),
      event.attendeeName || '',
      event.attendeeEmail || '',
      event.status,
      event.zoomUrl || '',
      event.createdAt.toDate().toISOString(),
    ]

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/events!A:J:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`)
    }

    console.log(`Event synced to Sheets: ${event.id}`)
  } catch (error) {
    console.error('Failed to sync event to Sheets:', error)
    throw error
  }
}

/**
 * スプレッドシートにヘッダー行を作成
 */
export async function initializeSheets(config: SheetsConfig): Promise<void> {
  try {
    // Contactsシートのヘッダー
    const contactsHeaders = [
      ['ID', 'Name', 'Email', 'Phone', 'LINE ID', 'Tags', 'Status', 'Created At'],
    ]

    // Eventsシートのヘッダー
    const eventsHeaders = [
      [
        'ID',
        'Type',
        'Title',
        'Start',
        'End',
        'Attendee Name',
        'Attendee Email',
        'Status',
        'Zoom URL',
        'Created At',
      ],
    ]

    // Contactsシートを作成
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/contacts!A1:H1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: contactsHeaders,
        }),
      }
    )

    // Eventsシートを作成
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/events!A1:J1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: eventsHeaders,
        }),
      }
    )

    console.log('Sheets initialized successfully')
  } catch (error) {
    console.error('Failed to initialize sheets:', error)
    throw error
  }
}
