import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSemesterBlockTable1755096523666
  implements MigrationInterface
{
  name = 'UpdateSemesterBlockTable1755096523666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "semester_blocks" DROP COLUMN "createdAt"
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks" DROP COLUMN "createdBy"
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks" DROP COLUMN "updatedAt"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "semester_blocks"
            ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks"
            ADD "createdBy" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks"
            ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        `);
  }
}
