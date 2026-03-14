'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider (e.g. Outlook, SES, etc.)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function approveDeveloper(id: string) {
  try {
    const developer = await prisma.developer.update({
      where: { id },
      data: { status: 'approved' },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: developer.email,
        subject: 'Developer Account Approved - Atlas',
        text: `Hello ${developer.name},\n\nYour developer account has been approved! You can now log into the developer portal.\n\nBest regards,\nAtlas Team`,
        html: `<p>Hello ${developer.name},</p><p>Your developer account has been approved! You can now log into the developer portal.</p><p>Best regards,<br/>Atlas Team</p>`,
      });
    } catch (emailErr) {
      console.error('Failed to send approval email:', emailErr);
    }

    revalidatePath('/dashboard/developers');
  } catch (err) {
    console.error('Failed to approve developer:', err);
  }
}

export async function rejectDeveloper(id: string) {
  try {
    const developer = await prisma.developer.update({
      where: { id },
      data: { status: 'rejected' },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: developer.email,
        subject: 'Developer Account Rejected - Atlas',
        text: `Hello ${developer.name},\n\nWe regret to inform you that your developer account application has been rejected.\n\nBest regards,\nAtlas Team`,
        html: `<p>Hello ${developer.name},</p><p>We regret to inform you that your developer account application has been rejected.</p><p>Best regards,<br/>Atlas Team</p>`,
      });
    } catch (emailErr) {
      console.error('Failed to send rejection email:', emailErr);
    }

    revalidatePath('/dashboard/developers');
  } catch (err) {
    console.error('Failed to reject developer:', err);
  }
}
