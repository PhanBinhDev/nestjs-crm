import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentFoldersTable1761812642933 implements MigrationInterface {
    name = 'CreateDocumentFoldersTable1761812642933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_folder"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "workspaceMemberId" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_cf0a9fa48053d1f93da40713cc1" FOREIGN KEY ("folderId") REFERENCES "document_folders"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_cf0a9fa48053d1f93da40713cc1"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "workspaceMemberId"
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_documents_folder" FOREIGN KEY ("folderId") REFERENCES "document_folders"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    }

}
