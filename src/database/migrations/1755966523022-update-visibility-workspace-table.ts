import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisibilityWorkspaceTable1755966523022
  implements MigrationInterface
{
  name = 'UpdateVisibilityWorkspaceTable1755966523022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "visibility" character varying(20) NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "visibility"
        `);
  }
}
