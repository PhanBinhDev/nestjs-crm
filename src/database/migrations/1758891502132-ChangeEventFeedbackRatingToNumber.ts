import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeEventFeedbackRatingToNumber1758891502132 implements MigrationInterface {
    name = 'ChangeEventFeedbackRatingToNumber1758891502132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_103c34798f7cd54893e6b3e5c2"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback" DROP COLUMN "rating"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."event_feedback_rating_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback"
            ADD "rating" integer NOT NULL DEFAULT 5
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_103c34798f7cd54893e6b3e5c2" ON "event_feedback" ("rating")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_103c34798f7cd54893e6b3e5c2"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback" DROP COLUMN "rating"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."event_feedback_rating_enum" AS ENUM('1', '2', '3', '4', '5')
        `);
        await queryRunner.query(`
            ALTER TABLE "event_feedback"
            ADD "rating" "public"."event_feedback_rating_enum" NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_103c34798f7cd54893e6b3e5c2" ON "event_feedback" ("rating")
        `);
    }

}
