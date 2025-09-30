import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameWorkspaceAvatarsToAvatar1759153523622 implements MigrationInterface {
    name = 'RenameWorkspaceAvatarsToAvatar1759153523622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces"
                RENAME COLUMN "avatars" TO "avatar"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "workspaces"
                RENAME COLUMN "avatar" TO "avatars"
        `);
    }

}
