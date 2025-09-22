declare module 'nodemailer' {
  import { EventEmitter } from 'events';

  export interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    replyTo?: string;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  export interface Transporter extends EventEmitter {
    sendMail(mailOptions: SendMailOptions): Promise<any>;
  }

  export function createTransport(options: TransportOptions): Transporter;
}