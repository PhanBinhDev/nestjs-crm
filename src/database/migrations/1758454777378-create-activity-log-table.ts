import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogTable1758454777378 implements MigrationInterface {
  name = 'CreateActivityLogTable1758454777378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb"
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "action" character varying(100) NOT NULL,
                "userId" uuid,
                "oldValue" json,
                "newValue" json,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_067d761e2956b77b14e534fd6f1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "workspaceId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log"
            ADD CONSTRAINT "FK_557203b3713859f55bb58f67228" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log"
            ADD CONSTRAINT "FK_d19abacc8a508c0429478ad166b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_log" DROP CONSTRAINT "FK_d19abacc8a508c0429478ad166b"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log" DROP CONSTRAINT "FK_557203b3713859f55bb58f67228"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "workspaceId" uuid NOT NULL
        `);
    await queryRunner.query(`
            DROP TABLE "activity_log"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }
}
