import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityFilesTable1759496707326
  implements MigrationInterface
{
  name = 'CreateActivityFilesTable1759496707326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activityId" uuid NOT NULL,
        "fileId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdBy" character varying NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_files_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activity_file_activity" ON "activity_files" ("activityId")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activity_file_file" ON "activity_files" ("fileId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_activity_file_unique" ON "activity_files" ("activityId", "fileId")
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_files" 
      ADD CONSTRAINT "FK_activity_files_activity" 
      FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_files" 
      ADD CONSTRAINT "FK_activity_files_file" 
      FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activity_files" DROP CONSTRAINT "FK_activity_files_file"
    `);

    await queryRunner.query(`
      ALTER TABLE "activity_files" DROP CONSTRAINT "FK_activity_files_activity"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_activity_file_unique"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_activity_file_file"
    `);

    await queryRunner.query(`
      DROP INDEX "idx_activity_file_activity"
    `);

    await queryRunner.query(`
      DROP TABLE "activity_files"
    `);
  }
}
