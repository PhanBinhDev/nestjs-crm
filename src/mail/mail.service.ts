import { IWorkspaceMemberJob } from '@/common/interfaces/job.interface';
import { AllConfigType } from '@/config/config.type';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailerService: MailerService,
  ) {}

  async sendEmailVerification(email: string, token: string) {
    // Please replace the URL with your own frontend URL
    const url = `${this.configService.get('app.url', { infer: true })}/api/v1/auth/verify/email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'email-verification',
      context: {
        email: email,
        url,
      },
    });
  }

  async sendForgotPassword(to: string, otp: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Reset your password',
      template: 'forgot-password',
      context: {
        otp,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendWorkspaceInvitation(data: IWorkspaceMemberJob) {
    const { email: to, ...rest } = data;

    await this.mailerService.sendMail({
      to,
      subject: `Lời mời tham gia workspace ${data.workspaceName}`,
      template: 'workspace-invitation',
      context: {
        ...rest,
      },
    });
  }
}
