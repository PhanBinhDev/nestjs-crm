import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventFeedbackFileTable1758889753088 implements MigrationInterface {
    name = 'UpdateEventFeedbackFileTable1758889753088'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "size"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "fileUrl"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "fileName"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "mimeType"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "uid" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "name" character varying(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP COLUMN "uid"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "mimeType" character varying(100)
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "fileName" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "fileUrl" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD "size" integer
        `);
    }

}
