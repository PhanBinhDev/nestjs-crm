import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevokedFields1762038389935 implements MigrationInterface {
  name = 'AddRevokedFields1762038389935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD "revokedAt" TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD "revokedBy" uuid
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."workspace_members_status_enum"
            RENAME TO "workspace_members_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."workspace_members_status_enum" AS ENUM('active', 'pending', 'reject', 'revoked')
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status" TYPE "public"."workspace_members_status_enum" USING "status"::"text"::"public"."workspace_members_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."workspace_members_status_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."workspace_members_status_enum_old" AS ENUM('active', 'pending', 'reject')
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status" TYPE "public"."workspace_members_status_enum_old" USING "status"::"text"::"public"."workspace_members_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."workspace_members_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."workspace_members_status_enum_old"
            RENAME TO "workspace_members_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP COLUMN "revokedBy"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP COLUMN "revokedAt"
        `);
  }
}
