import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeviceTokens1759942067346 implements MigrationInterface {
    name = 'UpdateDeviceTokens1759942067346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_notification_workspace"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "workspaceId"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "isDeleted"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "createdBy"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "deletedAt" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token"
            ADD CONSTRAINT "UQ_3cfccbd8d729bf9f340da0900e2" UNIQUE ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token" DROP COLUMN "tokens"
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token"
            ADD "tokens" jsonb NOT NULL DEFAULT '[]'
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token"
            ADD CONSTRAINT "FK_3cfccbd8d729bf9f340da0900e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "device-token" DROP CONSTRAINT "FK_3cfccbd8d729bf9f340da0900e2"
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token" DROP COLUMN "tokens"
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token"
            ADD "tokens" text NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "device-token" DROP CONSTRAINT "UQ_3cfccbd8d729bf9f340da0900e2"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "deletedAt"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "createdBy" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "isDeleted" boolean NOT NULL DEFAULT false
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "workspaceId" uuid
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_notification_workspace" ON "notifications" ("workspaceId")
        `);
    }

}
