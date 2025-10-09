import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinkPreviewFields1759857445440 implements MigrationInterface {
  name = 'AddLinkPreviewFields1759857445440';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD "thumbnail" character varying(2048)
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD "siteName" text
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD "siteDescription" text
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD "favicon" character varying(100)
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links"
            ADD "metadata" json
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP COLUMN "metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP COLUMN "favicon"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP COLUMN "siteDescription"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP COLUMN "siteName"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_links" DROP COLUMN "thumbnail"
        `);
  }
}
