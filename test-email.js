import { sendEmail } from './backend/utils/sendEmail.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    await sendEmail({
      email: process.env.EMAIL_USER,
      subject: 'Test',
      html: '<h1>Test</h1>'
    });
    console.log('Success');
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
