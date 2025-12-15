import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeEventFeedbackRatingToDecimal20251208212135
  implements MigrationInterface
{
  name = 'ChangeEventFeedbackRatingToDecimal20251208212135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Đổi type của rating từ integer sang decimal(3,2)
    await queryRunner.query(`
      ALTER TABLE "event_feedback"
      ALTER COLUMN "rating" TYPE decimal(3,2) USING "rating"::decimal(3,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert về integer
    await queryRunner.query(`
      ALTER TABLE "event_feedback"
      ALTER COLUMN "rating" TYPE integer USING ROUND("rating")::integer
    `);
  }
}

