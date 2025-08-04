import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityAssigneesTable1753947582190
  implements MigrationInterface
{
  name = 'CreateActivityAssigneesTable1753947582190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(`
    //         CREATE TYPE "public"."activity_assignees_role_enum" AS ENUM('owner', 'collaborator', 'reviewer')
    //     `);
    // await queryRunner.query(`
    //         CREATE TYPE "public"."activity_assignees_status_enum" AS ENUM('pending', 'accepted', 'declined')
    //     `);
    await queryRunner.query(`
            CREATE TABLE "activity_assignees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."activity_assignees_role_enum" NOT NULL DEFAULT 'collaborator',
                "status" "public"."activity_assignees_status_enum" NOT NULL DEFAULT 'pending',
                "assignedAt" TIMESTAMP WITH TIME ZONE,
                "assignedBy" uuid,
                "note" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activity_assignees" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_2693bfed4c04d9ebc13d668bdff" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_f8addab376d11039cd3b252c8e8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_f8addab376d11039cd3b252c8e8"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_2693bfed4c04d9ebc13d668bdff"
        `);

    await queryRunner.query(`
            DROP TABLE "activity_assignees"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."activity_assignees_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."activity_assignees_role_enum"
        `);
  }
}
