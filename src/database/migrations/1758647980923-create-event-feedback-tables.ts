import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventFeedbackTables1758647980923 implements MigrationInterface {
    name = 'CreateEventFeedbackTables1758647980923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."event_feedback_rating_enum" AS ENUM('1', '2', '3', '4', '5')
        `);
        await queryRunner.query(`
            CREATE TABLE "event_feedback" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "email" character varying(255) NOT NULL,
                "numPhone" character varying(20),
                "fullName" character varying(255) NOT NULL,
                "studentId" character varying(50) NOT NULL,
                "rating" "public"."event_feedback_rating_enum" NOT NULL,
                "comments" text,
                "image" character varying(500),
                "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_124de47cbc8a4b768709b8f00b6" UNIQUE ("activityId", "email"),
                CONSTRAINT "PK_45430c2b672fff2eef02db0fed1" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_103c34798f7cd54893e6b3e5c2" ON "event_feedback" ("rating")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f4436a9cf7088f381aa9a188e6" ON "event_feedback" ("email")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2180850236cb098536a90541ff" ON "event_feedback" ("activityId")
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback"
            ADD CONSTRAINT "FK_2180850236cb098536a90541ff1" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_feedback" DROP CONSTRAINT "FK_2180850236cb098536a90541ff1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2180850236cb098536a90541ff"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f4436a9cf7088f381aa9a188e6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_103c34798f7cd54893e6b3e5c2"
        `);
        await queryRunner.query(`
            DROP TABLE "event_feedback"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."event_feedback_rating_enum"
        `);
    }

}
