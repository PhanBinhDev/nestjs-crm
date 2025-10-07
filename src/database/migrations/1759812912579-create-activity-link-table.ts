import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLinkTable1759812912579
  implements MigrationInterface
{
  name = 'CreateActivityLinkTable1759812912579';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "activity_links" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "url" character varying(2048) NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" uuid NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_69509fa73dd5706f71fa352c9b3" PRIMARY KEY ("id")
            )
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
            ADD CONSTRAINT "FK_e2dfff6c31ef0c97b49045b504a" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP CONSTRAINT "FK_e2dfff6c31ef0c97b49045b504a"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP CONSTRAINT "FK_a79aa863c38f9417825b6d2f5fb"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_activity_link_activity"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_links"
        `);
  }
}
