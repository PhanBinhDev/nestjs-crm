import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1759037619148 implements MigrationInterface {
  name = 'CreateCategoryTable1759037619148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities"
                RENAME COLUMN "category" TO "categoryId"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."activities_category_enum"
            RENAME TO "activities_categoryid_enum"
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" character varying(255),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_1f9eb88f32fdc6450a65d28b5fb" UNIQUE ("name"),
                CONSTRAINT "PK_8cc7b00daa0d770af779497e32c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "categoryId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "categoryId" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_da47c633d8bb7ee8ca9009788d4" FOREIGN KEY ("categoryId") REFERENCES "activity_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_da47c633d8bb7ee8ca9009788d4"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "categoryId"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "categoryId" "public"."activities_categoryid_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_categories"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."activities_categoryid_enum"
            RENAME TO "activities_category_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
                RENAME COLUMN "categoryId" TO "category"
        `);
  }
}
