import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { UserAccountsConfig } from '../config/user-accounts.config';

@Injectable()
export class NodemailerService {
  constructor(private userAccountsConfig: UserAccountsConfig) {}

  async sendEmail(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.userAccountsConfig.email,
        pass: this.userAccountsConfig.emailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Blogger Platform" <${this.userAccountsConfig.email}>`,
      to: email,
      subject: 'Registration Confirmation',
      html: `<h1>Thank you for registration</h1>
             <p>To finish registration please follow the link below:
                <a href='https://some-frontend.com/confirm-registration?code=${code}'>complete registration</a>
             </p>`,
    });

    return info;
  }

  async sendPasswordRecoveryEmail(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.userAccountsConfig.email,
        pass: this.userAccountsConfig.emailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Blogger Platform" <${this.userAccountsConfig.email}>`,
      to: email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
             <p>To finish password recovery please follow the link below:
                <a href='https://some-frontend.com/password-recovery?code=${code}'>recovery password</a>
             </p>`,
    });

    return info;
  }
}
