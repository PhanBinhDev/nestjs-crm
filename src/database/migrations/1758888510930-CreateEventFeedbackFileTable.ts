import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventFeedbackFileTable1758888510930 implements MigrationInterface {
    name = 'CreateEventFeedbackFileTable1758888510930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "event_feedback_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventFeedbackId" uuid NOT NULL,
                "fileUrl" character varying(255) NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "mimeType" character varying(100),
                "size" integer,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7b6b3d3cdc5b779fe627548d119" PRIMARY KEY ("id")
            )
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
            DROP TABLE "event_feedback_files"
        `);
    }

}
