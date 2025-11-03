/**
 * MyLoop Cloud Functions
 *
 * This file exports all Cloud Functions for the MyLoop application.
 * Functions are organized by feature area and deployed to Firebase.
 */

import * as admin from 'firebase-admin'

// Initialize Firebase Admin
admin.initializeApp()

// Export functions by feature area
export * from './line/webhook'
export * from './scenarios/dispatcher'
export * from './bookings/reminder'
export * from './ai/generator'
