import { MigrationInterface, QueryRunner } from 'typeorm';

export class AvatarsWorkspaces1759205784520 implements MigrationInterface {
  name = 'AvatarsWorkspaces1759205784520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "event_feedback_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventFeedbackId" uuid NOT NULL,
                "uid" character varying(255) NOT NULL,
                "name" character varying(255) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7b6b3d3cdc5b779fe627548d119" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."workspace_members_status_enum" AS ENUM('active', 'pending', 'reject')
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD "status" "public"."workspace_members_status_enum" NOT NULL DEFAULT 'pending'
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "avatars" character varying(255)
        `);
    await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD CONSTRAINT "FK_3e6e504f746eabd9785763e1c04" FOREIGN KEY ("eventFeedbackId") REFERENCES "event_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP CONSTRAINT "FK_3e6e504f746eabd9785763e1c04"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "avatars"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP COLUMN "status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."workspace_members_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "event_feedback_files"
        `);
  }
}
