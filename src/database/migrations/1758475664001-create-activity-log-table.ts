import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogTable1758475664001 implements MigrationInterface {
  name = 'CreateActivityLogTable1758475664001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "activity_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "action" character varying(100) NOT NULL,
                "message" character varying(255),
                "oldValue" jsonb,
                "newValue" jsonb,
                "metadata" jsonb,
                "activityId" uuid,
                "userId" uuid,
                "parentLogId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_067d761e2956b77b14e534fd6f1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'inactive', 'pending')
        `);
    await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying NOT NULL,
                "name" character varying NOT NULL,
                "address" character varying,
                "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active',
                "schemaName" character varying NOT NULL,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "ownerId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a" UNIQUE ("code"),
                CONSTRAINT "UQ_fae19dfc02d10ccce4412abb397" UNIQUE ("schemaName"),
                CONSTRAINT "REL_dccf2382a3ffe4edfc09b8eeb0" UNIQUE ("ownerId"),
                CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3021c18db2b363ae9324c826c5" ON "tenants" ("code")
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
    await queryRunner.query(`
            ALTER TABLE "activity_log"
            ADD CONSTRAINT "FK_74b17f68c059d56ec1926edc948" FOREIGN KEY ("parentLogId") REFERENCES "activity_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD CONSTRAINT "FK_dccf2382a3ffe4edfc09b8eeb06" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tenants" DROP CONSTRAINT "FK_dccf2382a3ffe4edfc09b8eeb06"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log" DROP CONSTRAINT "FK_74b17f68c059d56ec1926edc948"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log" DROP CONSTRAINT "FK_d19abacc8a508c0429478ad166b"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_log" DROP CONSTRAINT "FK_557203b3713859f55bb58f67228"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3021c18db2b363ae9324c826c5"
        `);
    await queryRunner.query(`
            DROP TABLE "tenants"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tenants_status_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_log"
        `);
  }
}
