import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFollowTable1759980171103 implements MigrationInterface {
    name = 'AddFollowTable1759980171103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "activity_follows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "activityId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5c91280cda2b63fb0cc697e2b09" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_activity_follow_activity_user" ON "activity_follows" ("activityId", "userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_activity_follow_user" ON "activity_follows" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_activity_follow_activity" ON "activity_follows" ("activityId")
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_follows"
            ADD CONSTRAINT "FK_f905ed177c918f6332ba2859c8a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_follows"
            ADD CONSTRAINT "FK_3ea6c4268fe5f90ca1ba44f9832" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "activity_follows" DROP CONSTRAINT "FK_3ea6c4268fe5f90ca1ba44f9832"
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_follows" DROP CONSTRAINT "FK_f905ed177c918f6332ba2859c8a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_follow_activity"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_follow_user"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_follow_activity_user"
        `);
        await queryRunner.query(`
            DROP TABLE "activity_follows"
        `);
    }

}
