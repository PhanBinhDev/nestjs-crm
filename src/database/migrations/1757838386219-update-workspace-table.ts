import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWorkspaceTable1757838386219 implements MigrationInterface {
  name = 'UpdateWorkspaceTable1757838386219';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "workspace_view_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspaceId" uuid NOT NULL,
                "cardSize" character varying NOT NULL DEFAULT 'medium',
                "stackFields" boolean NOT NULL DEFAULT false,
                "showEmptyFields" boolean NOT NULL DEFAULT false,
                "fields" jsonb NOT NULL DEFAULT '{"shown":["name"],"popular":["description","status"],"hidden":["assignees","dateClosed","dateUpdated","dueDate","priority","tags","taskId","taskType","progress","location","estimateTime","attachments","checklist","comments","mandatory","category"]}',
                "maxVisibleAssignees" integer NOT NULL DEFAULT '3',
                "additionalSettings" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e974e4721069b5720836a742aea" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_view_settings"
            ADD CONSTRAINT "FK_c41ba76e41f4dbad3d16e242e3d" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workspace_view_settings" DROP CONSTRAINT "FK_c41ba76e41f4dbad3d16e242e3d"
        `);
    await queryRunner.query(`
            DROP TABLE "workspace_view_settings"
        `);
  }
}
