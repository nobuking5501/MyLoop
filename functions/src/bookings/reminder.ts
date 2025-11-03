import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

/**
 * Booking Reminder
 * 毎時実行され、予約の1日前と当日のリマインダーを送信
 */
export const bookingReminder = functions
  .region('asia-northeast1')
  .pubsub.schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      const now = new Date()

      // 1日後の範囲（23-25時間後）
      const oneDayLaterStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
      const oneDayLaterEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

      // 3時間後の範囲（2-4時間後 - 当日リマインダー）
      const sameDayStart = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const sameDayEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000)

      // 1日前のリマインダーを送信
      await sendReminders(
        oneDayLaterStart,
        oneDayLaterEnd,
        'tomorrow',
        '明日が予約日です'
      )

      // 当日のリマインダーを送信
      await sendReminders(
        sameDayStart,
        sameDayEnd,
        'today',
        '本日が予約日です'
      )

      console.log('Reminder processing completed')
      return null
    } catch (error) {
      console.error('Reminder error:', error)
      throw error
    }
  })

/**
 * リマインダーを送信
 */
async function sendReminders(
  startTime: Date,
  endTime: Date,
  type: 'tomorrow' | 'today',
  messagePrefix: string
): Promise<void> {
  // 指定範囲の予約を取得
  const eventsSnapshot = await db
    .collection('events')
    .where('status', '==', 'scheduled')
    .where('start', '>=', admin.firestore.Timestamp.fromDate(startTime))
    .where('start', '<=', admin.firestore.Timestamp.fromDate(endTime))
    .get()

  if (eventsSnapshot.empty) {
    console.log(`No events found for ${type} reminder`)
    return
  }

  console.log(`Processing ${eventsSnapshot.size} ${type} reminders`)

  const promises = eventsSnapshot.docs.map(async (doc) => {
    const event = doc.data()

    // リマインダー送信済みチェック（フィールドを使用）
    const reminderField = type === 'tomorrow' ? 'reminderSent' : 'sameDayReminderSent'

    if (event[reminderField]) {
      console.log(`Reminder already sent for event ${doc.id}`)
      return
    }

    try {
      // コンタクト情報を取得
      if (!event.attendeeRef) {
        console.log(`No attendee for event ${doc.id}`)
        return
      }

      const contactDoc = await db.collection('contacts').doc(event.attendeeRef).get()

      if (!contactDoc.exists) {
        console.error(`Contact not found: ${event.attendeeRef}`)
        return
      }

      const contact = contactDoc.data()!

      // リマインダーメッセージを作成
      const startDate = event.start.toDate()
      const message = `${messagePrefix} 📅\n\n【${event.title}】\n日時: ${startDate.toLocaleString('ja-JP')}\n${
        event.zoomUrl ? `\nZoom URL:\n${event.zoomUrl}` : ''
      }`

      // メッセージを送信（実際はLINE Messaging API）
      console.log(`[REMINDER] To: ${contact.lineId}, Content: ${message}`)

      // リマインダー送信フラグを更新
      await doc.ref.update({
        [reminderField]: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`${type} reminder sent for event ${doc.id}`)
    } catch (error) {
      console.error(`Failed to send reminder for event ${doc.id}:`, error)
    }
  })

  await Promise.all(promises)
}
