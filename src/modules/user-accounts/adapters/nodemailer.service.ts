import nodemailer from 'nodemailer';
import { injectable } from 'inversify';
import { appConfig } from '../../../common/config/config';

@injectable()
export class NodemailerService {
  constructor() {}
  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => string,
  ): Promise<boolean> {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true для 465
      auth: {
        user: appConfig.EMAIL,
        pass: appConfig.EMAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: {
        name: 'Kek 👻',
        address: appConfig.EMAIL,
      },
      to: email,
      subject: 'Your code is here',
      html: template(code), // html body
    });

    return !!info;
  }
}
