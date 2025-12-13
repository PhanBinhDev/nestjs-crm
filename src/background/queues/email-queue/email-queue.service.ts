import {
  IVerifyEmailJob,
  IWorkspaceMemberJob,
  ITaskAssignedEmailJob,
} from '@/common/interfaces/job.interface';
import { MailService } from '@/mail/mail.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(private readonly mailService: MailService) {}

  async sendEmailVerification(data: IVerifyEmailJob): Promise<void> {
    this.logger.debug(`Sending email verification to ${data.email}`);
    await this.mailService.sendEmailVerification(data.email, data.token);
  }

  async sendWorkspaceInvitation(data: IWorkspaceMemberJob): Promise<void> {
    this.logger.debug(`Sending workspace invitation to ${data.email}`);
    await this.mailService.sendWorkspaceInvitation(data);
  }

  async sendTaskAssignedEmail(data: ITaskAssignedEmailJob): Promise<void> {
    this.logger.debug(`Sending task assigned email to ${data.email}`);
    await this.mailService.sendTaskAssignedEmail(data);
  }
}
