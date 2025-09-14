import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateActivityTable1757760494815 implements MigrationInterface {
  name = 'UpdateActivityTable1757760494815';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_49d43cdbf616c4466c39360de70"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ALTER COLUMN "semesterId" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_49d43cdbf616c4466c39360de70" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_49d43cdbf616c4466c39360de70"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ALTER COLUMN "semesterId"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_49d43cdbf616c4466c39360de70" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
