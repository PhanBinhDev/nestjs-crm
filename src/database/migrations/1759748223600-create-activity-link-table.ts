import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivityLinkTable1759748223600 implements MigrationInterface {
    name = 'CreateActivityLinkTable1759748223600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."activity_links_linktype_enum" AS ENUM('external', 'task')
        `);
        await queryRunner.query(`
            CREATE TABLE "activity_links" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "url" character varying(2048),
                "description" text,
                "linkedActivityId" uuid,
                "linkType" "public"."activity_links_linktype_enum" NOT NULL DEFAULT 'external',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_69509fa73dd5706f71fa352c9b3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_activity_link_linked_activity" ON "activity_links" ("linkedActivityId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_activity_link_activity" ON "activity_links" ("activityId")
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD CONSTRAINT "FK_a79aa863c38f9417825b6d2f5fb" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD CONSTRAINT "FK_7d0e637e1287f94ca295221a2e8" FOREIGN KEY ("linkedActivityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "activity_links" DROP CONSTRAINT "FK_7d0e637e1287f94ca295221a2e8"
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_links" DROP CONSTRAINT "FK_a79aa863c38f9417825b6d2f5fb"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_link_activity"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_activity_link_linked_activity"
        `);
        await queryRunner.query(`
            DROP TABLE "activity_links"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."activity_links_linktype_enum"
        `);
    }

}
