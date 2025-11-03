import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

/**
 * Scenario Message Dispatcher
 * 10分ごとに実行され、送信予定のメッセージを配信
 */
export const scenarioDispatcher = functions
  .region('asia-northeast1')
  .pubsub.schedule('every 10 minutes')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now()

      // 送信予定時刻が過ぎているpendingメッセージを取得
      const queueSnapshot = await db
        .collection('message_queue')
        .where('status', '==', 'pending')
        .where('scheduledAt', '<=', now)
        .limit(100) // 一度に処理する上限
        .get()

      if (queueSnapshot.empty) {
        console.log('No pending messages to send')
        return null
      }

      console.log(`Processing ${queueSnapshot.size} pending messages`)

      // 各メッセージを処理
      const promises = queueSnapshot.docs.map(async (doc) => {
        const message = doc.data()

        try {
          // コンタクト情報を取得
          const contactDoc = await db
            .collection('contacts')
            .doc(message.contactId)
            .get()

          if (!contactDoc.exists) {
            console.error(`Contact not found: ${message.contactId}`)
            await doc.ref.update({ status: 'failed', error: 'Contact not found' })
            return
          }

          const contact = contactDoc.data()!

          // ステータスがアクティブでない場合はスキップ
          if (contact.status !== 'active') {
            console.log(`Skipping inactive contact: ${message.contactId}`)
            await doc.ref.update({
              status: 'skipped',
              note: 'Contact is not active',
            })
            return
          }

          // メッセージを送信
          await sendLineMessage(contact.lineId, message.templateId, contact)

          // ステータスを更新
          await doc.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          })

          console.log(`Message sent to ${message.contactId}`)
        } catch (error: any) {
          console.error(`Failed to send message:`, error)

          await doc.ref.update({
            status: 'failed',
            error: error.message || 'Unknown error',
          })
        }
      })

      await Promise.all(promises)

      console.log('Dispatcher completed')
      return null
    } catch (error) {
      console.error('Dispatcher error:', error)
      throw error
    }
  })

/**
 * LINE Messaging APIでメッセージを送信
 */
async function sendLineMessage(
  lineId: string,
  templateContent: string,
  contact: any
): Promise<void> {
  // 変数を置換
  let message = templateContent
  message = message.replace(/\{\{name\}\}/g, contact.name || 'お客様')
  message = message.replace(/\{\{email\}\}/g, contact.email || '')

  // TODO: 実際のLINE Messaging API呼び出し
  // integrationからアクセストークンを取得する必要がある
  /*
  const lineClient = new line.Client({
    channelAccessToken: accessToken,
  })

  await lineClient.pushMessage(lineId, {
    type: 'text',
    text: message,
  })
  */

  // 仮実装：ログ出力のみ
  console.log(`[LINE MESSAGE] To: ${lineId}, Content: ${message}`)

  // 監査ログに記録
  await db.collection('audit_logs').add({
    action: 'message_sent',
    resource: 'line',
    resourceId: lineId,
    details: {
      message: message.substring(0, 100),
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}
