import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUpdateWorkspacesTable1755962949148
  implements MigrationInterface
{
  name = 'CreateUpdateWorkspacesTable1755962949148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."workspace_members_role_enum" AS ENUM('owner', 'admin', 'member')
        `);
    await queryRunner.query(`
            CREATE TABLE "workspace_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspaceId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."workspace_members_role_enum" NOT NULL DEFAULT 'member',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "workspaces" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "icon" character varying(255),
                "avatars" character varying(255),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "workspaceId" uuid NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "files"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD CONSTRAINT "FK_d4a4e75f00c401f5e01c2270fd4" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD CONSTRAINT "FK_2e9fde708ed5498c1529f5cc161" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_a0eed66127597462709480b75f5" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD CONSTRAINT "FK_0ffe06896c24546e54a52906155" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_69d71ead96cb0e6244bd975040f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "FK_734c779fc5d891b8572f7ff9c5e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_734c779fc5d891b8572f7ff9c5e"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_69d71ead96cb0e6244bd975040f"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_0ffe06896c24546e54a52906155"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_a0eed66127597462709480b75f5"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP CONSTRAINT "FK_2e9fde708ed5498c1529f5cc161"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP CONSTRAINT "FK_d4a4e75f00c401f5e01c2270fd4"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "files" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            DROP TABLE "workspaces"
        `);
    await queryRunner.query(`
            DROP TABLE "workspace_members"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."workspace_members_role_enum"
        `);
  }
}
