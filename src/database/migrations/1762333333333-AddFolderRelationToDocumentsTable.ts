import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolderRelationToDocumentsTable1762333333333 implements MigrationInterface {
    name = 'AddFolderRelationToDocumentsTable1762333333333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD COLUMN "folderId" uuid NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_documents_folder" FOREIGN KEY ("folderId") REFERENCES "document_folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_folder";
        `);
        await queryRunner.query(`
            ALTER TABLE "documents" DROP COLUMN "folderId";
        `);
    }
}
