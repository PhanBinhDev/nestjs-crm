import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStageSemesterAndCreateBlockChecklist1754703181806
  implements MigrationInterface
{
  name = 'UpdateStageSemesterAndCreateBlockChecklist1754703181806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "semesters"
                RENAME COLUMN "blocks" TO "year"
        `);
    await queryRunner.query(`
            CREATE TABLE "semester_blocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "semesterId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c26f38cf9397a1ea52114817818" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_checklists" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "activityId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ff8747e9743b6d8ed1b8652ad9b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_checklist_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" character varying(255) NOT NULL,
                "isDone" boolean NOT NULL DEFAULT false,
                "checklistId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_17287f0f58f5475345da4dfe41d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "color" character varying(7)
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "username" character varying(100)
        `);
    await queryRunner.query(`
      UPDATE "users" SET "username" = ("role"::text) || floor(random()*100000)::int
      WHERE "username" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "username" SET NOT NULL
    `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "dateOfBirth" date
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "major" character varying(100)
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar" character varying(255)
        `);
    await queryRunner.query(`
            ALTER TABLE "semesters" DROP COLUMN "year"
        `);
    await queryRunner.query(`
            ALTER TABLE "semesters"
            ADD "year" integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks"
            ADD CONSTRAINT "FK_ff112764ab1da5561a6ae089f2c" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD CONSTRAINT "FK_91574dfdc65c91224f52a6b3d68" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklist_items"
            ADD CONSTRAINT "FK_210840a4f7d614ef80cb8b73cff" FOREIGN KEY ("checklistId") REFERENCES "activity_checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_checklist_items" DROP CONSTRAINT "FK_210840a4f7d614ef80cb8b73cff"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP CONSTRAINT "FK_91574dfdc65c91224f52a6b3d68"
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks" DROP CONSTRAINT "FK_ff112764ab1da5561a6ae089f2c"
        `);
    await queryRunner.query(`
            ALTER TABLE "semesters" DROP COLUMN "year"
        `);
    await queryRunner.query(`
            ALTER TABLE "semesters"
            ADD "year" json
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "major"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "dateOfBirth"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "username"
        `);
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "color"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_checklist_items"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_checklists"
        `);
    await queryRunner.query(`
            DROP TABLE "semester_blocks"
        `);
    await queryRunner.query(`
            ALTER TABLE "semesters"
                RENAME COLUMN "year" TO "blocks"
        `);
  }
}
