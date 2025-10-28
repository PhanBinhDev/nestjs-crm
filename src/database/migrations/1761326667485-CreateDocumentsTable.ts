import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTable1761326667485 implements MigrationInterface {
  name = 'CreateDocumentsTable1761326667485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_notification_workspace_member"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_notification_workspace_member"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."documents_type_enum" AS ENUM('FILE', 'LINK')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."documents_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')
        `);
    await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(500) NOT NULL,
                "description" text,
                "type" "public"."documents_type_enum" NOT NULL DEFAULT 'FILE',
                "status" "public"."documents_status_enum" NOT NULL DEFAULT 'DRAFT',
                "fileUrl" character varying,
                "fileName" character varying,
                "fileType" character varying,
                "fileSize" bigint,
                "publicId" character varying,
                "linkUrl" character varying,
                "linkPreview" jsonb,
                "workspaceId" uuid NOT NULL,
                "createdById" uuid NOT NULL,
                "updatedById" uuid,
                "metadata" jsonb,
                "viewCount" integer NOT NULL DEFAULT '0',
                "downloadCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "workspaceMemberId"
        `);
    await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_ab977275b98b482fe6081f9b8a6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_129be5647f7217471286e249c34" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_682adcc34fbd7d16186705a8ce2" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_682adcc34fbd7d16186705a8ce2"
        `);
    await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_129be5647f7217471286e249c34"
        `);
    await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_ab977275b98b482fe6081f9b8a6"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "workspaceMemberId" uuid
        `);
    await queryRunner.query(`
            DROP TABLE "documents"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."documents_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."documents_type_enum"
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_notification_workspace_member" ON "notifications" ("workspaceMemberId")
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notification_workspace_member" FOREIGN KEY ("workspaceMemberId") REFERENCES "workspace_members"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }
}
