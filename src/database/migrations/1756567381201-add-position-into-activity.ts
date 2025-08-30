import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPositionIntoActivity1756567381201
  implements MigrationInterface
{
  name = 'AddPositionIntoActivity1756567381201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "position" integer NOT NULL DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "position"
        `);
  }
}
