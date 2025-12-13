import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationPreferencesTable1763000000000
  implements MigrationInterface
{
  name = 'CreateNotificationPreferencesTable1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."notification_preferences_type_enum" AS ENUM(
                'task_assigned',
                'task_comment',
                'task_due',
                'workspace_member',
                'weekly_newsletter',
                'security'
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "notification_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."notification_preferences_type_enum" NOT NULL,
                "enabled" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_preferences_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "idx_preference_user" ON "notification_preferences" ("userId")
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_notification_preference_user_type" 
            ON "notification_preferences" ("userId", "type")
        `);

    await queryRunner.query(`
            ALTER TABLE "notification_preferences"
            ADD CONSTRAINT "FK_notification_preferences_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notification_preferences"
            DROP CONSTRAINT "FK_notification_preferences_user"
        `);

    await queryRunner.query(`
            DROP INDEX "UQ_notification_preference_user_type"
        `);

    await queryRunner.query(`
            DROP INDEX "idx_preference_user"
        `);

    await queryRunner.query(`
            DROP TABLE "notification_preferences"
        `);

    await queryRunner.query(`
            DROP TYPE "public"."notification_preferences_type_enum"
        `);
  }
}

