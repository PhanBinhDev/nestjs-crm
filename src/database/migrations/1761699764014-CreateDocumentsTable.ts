import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentsTable1761699764014 implements MigrationInterface {
    name = 'CreateDocumentsTable1761699764014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(500) NOT NULL,
                "description" text,
                "type" "public"."documents_type_enum" NOT NULL DEFAULT 'FILE',
                "status" "public"."documents_status_enum" NOT NULL DEFAULT 'DRAFT',
                "fileId" uuid,
                "linkUrl" character varying,
                "linkPreview" jsonb,
                "createdById" uuid NOT NULL,
                "updatedById" uuid,
                "metadata" jsonb,
                "viewCount" integer NOT NULL DEFAULT '0',
                "downloadCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_27f4230372010337b40536bb76d" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_129be5647f7217471286e249c34" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "documents"
            ADD CONSTRAINT "FK_682adcc34fbd7d16186705a8ce2" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_682adcc34fbd7d16186705a8ce2"
        `);
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_129be5647f7217471286e249c34"
        `);
        await queryRunner.query(`
            ALTER TABLE "documents" DROP CONSTRAINT "FK_27f4230372010337b40536bb76d"
        `);
        await queryRunner.query(`
            DROP TABLE "documents"
        `);
    }

}
