import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1755940075256 implements MigrationInterface {
  name = 'CreateFilesTable1755940075256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "url" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "size" integer NOT NULL,
                "fileName" character varying NOT NULL,
                "destination" character varying NOT NULL,
                "uploadedBy" uuid,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "FK_a443b3a690edf7e690e3dace8d9" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_a443b3a690edf7e690e3dace8d9"
        `);
    await queryRunner.query(`
            DROP TABLE "files"
        `);
  }
}
