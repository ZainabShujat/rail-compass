import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('User:', process.env.EMAIL_USER);
console.log('Pass Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.verify();
    console.log('Nodemailer configuration is valid.');
  } catch (error) {
    console.error('Nodemailer verification failed:');
    console.error(error);
  }
};

testEmail();
