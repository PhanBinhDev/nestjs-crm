import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTable1755880395559
  implements MigrationInterface
{
  name = 'CreateNotificationTable1755880395559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "senderId" uuid,
                "title" character varying(255) NOT NULL,
                "message" text,
                "type" character varying(255),
                "data" json,
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "notifications"
        `);
  }
}
