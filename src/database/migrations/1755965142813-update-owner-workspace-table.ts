import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOwnerWorkspaceTable1755965142813
  implements MigrationInterface
{
  name = 'UpdateOwnerWorkspaceTable1755965142813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD "ownerId" uuid NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD CONSTRAINT "FK_77607c5b6af821ec294d33aab0c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspaces" DROP CONSTRAINT "FK_77607c5b6af821ec294d33aab0c"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces" DROP COLUMN "ownerId"
        `);
  }
}
