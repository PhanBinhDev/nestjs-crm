import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceIdIntoActivtyTable1758294147055
  implements MigrationInterface
{
  name = 'AddWorkspaceIdIntoActivtyTable1758294147055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "workspaceId" uuid NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "workspaceId"
        `);
  }
}
