// types/support.ts
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}