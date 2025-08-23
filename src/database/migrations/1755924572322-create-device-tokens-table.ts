import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeviceTokensTable1755924572322
  implements MigrationInterface
{
  name = 'CreateDeviceTokensTable1755924572322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "device-token" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "tokens" text NOT NULL,
                "deviceInfo" character varying(255),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5cacd370c5c8cfbc961afa647a9" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "device-token"
        `);
  }
}
