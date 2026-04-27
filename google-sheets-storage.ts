import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar'
];

export async function getSheetsAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) return null;

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });
}

export async function getSheetsClient() {
  const auth = await getSheetsAuth();
  if (!auth) return null;
  return google.sheets({ version: 'v4', auth });
}

export async function logBookingToSheet(bookingData: any) {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const range = 'Rezervari!A:A'; // Check ID column for next ID

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    const nextId = rows.length; // Row length includes header, so index 1 is next ID if length is 1

    const values = [
      [
        nextId,
        new Date().toLocaleString('ro-RO'),
        bookingData.guestName,
        bookingData.guestEmail,
        bookingData.apartmentName,
        bookingData.checkIn,
        bookingData.checkOut,
        bookingData.totalPrice,
        bookingData.status,
        bookingData.paymentIntentId || '',
        bookingData.source || 'Direct'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Rezervari!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    console.log(`Logged booking #${nextId} to Google Sheet`);
  } catch (error) {
    console.error("Error logging booking to Google Sheet:", error);
  }
}

export async function logLoginToSheet(userData: any) {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const range = 'Autentificari!A:A';

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values || [];
    const nextId = rows.length;

    const values = [
      [
        nextId,
        new Date().toLocaleString('ro-RO'),
        userData.email,
        userData.displayName || 'Nespecificat',
        userData.method || 'Google/Firebase'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Autentificari!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    console.log(`Logged login #${nextId} to Google Sheet`);
  } catch (error) {
    console.error("Error logging login to Google Sheet:", error);
  }
}
