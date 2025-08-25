import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveWorkspaceIdRelation1756133371052
  implements MigrationInterface
{
  name = 'RemoveWorkspaceIdRelation1756133371052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP CONSTRAINT "FK_d4a4e75f00c401f5e01c2270fd4"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP CONSTRAINT "FK_2e9fde708ed5498c1529f5cc161"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_a0eed66127597462709480b75f5"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_0ffe06896c24546e54a52906155"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_69d71ead96cb0e6244bd975040f"
        `);
    await queryRunner.query(`
            ALTER TABLE "stages" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP COLUMN "workspaceId"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "workspaceId" uuid NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD "workspaceId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_69d71ead96cb0e6244bd975040f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD CONSTRAINT "FK_0ffe06896c24546e54a52906155" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_a0eed66127597462709480b75f5" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD CONSTRAINT "FK_2e9fde708ed5498c1529f5cc161" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD CONSTRAINT "FK_d4a4e75f00c401f5e01c2270fd4" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
