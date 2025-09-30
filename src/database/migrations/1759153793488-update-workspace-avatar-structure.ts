import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWorkspaceAvatarStructure1759153793488 implements MigrationInterface {
    name = 'UpdateWorkspaceAvatarStructure1759153793488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "avatar"
        `);
        await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "avatarUid" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "avatarName" character varying(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "avatarName"
        `);
        await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "avatarUid"
        `);
        await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "avatar" character varying(255)
        `);
    }

}
