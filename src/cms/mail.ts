// Optional email notification for new enquiries. Does nothing unless SMTP_HOST is set.
import nodemailer from 'nodemailer';
import { env } from './env';
import type { Enquiry } from './enquiries';

export async function notify(enquiry: Enquiry, serviceLabel: string, fallbackTo: string): Promise<void> {
  const smtp = env.smtp;
  if (!smtp) return;
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
  await transport.sendMail({
    from: smtp.from,
    to: smtp.to || fallbackTo,
    replyTo: enquiry.email,
    subject: `New enquiry: ${enquiry.name} (${enquiry.company})`,
    text: [
      `Name: ${enquiry.name}`,
      `Company: ${enquiry.company}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone}`,
      `Looking for: ${serviceLabel}`,
      `Language: ${enquiry.lang}`,
      '',
      enquiry.message || '(no message)',
    ].join('\n'),
  });
}
