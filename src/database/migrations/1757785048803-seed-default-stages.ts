import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultStages1757785048803 implements MigrationInterface {
  name = 'SeedDefaultStages1757785048803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."stages_stagegroup_enum" AS ENUM('not_started', 'active', 'done', 'closed')
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "stageGroup" "public"."stages_stagegroup_enum" NOT NULL DEFAULT 'active'
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "isBuiltIn" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "groupPosition" integer NOT NULL DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "groupPosition"
        `);
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "isBuiltIn"
        `);
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "stageGroup"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."stages_stagegroup_enum"
        `);
  }
}
