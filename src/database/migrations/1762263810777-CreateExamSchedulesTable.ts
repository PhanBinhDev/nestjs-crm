import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamSchedulesTable1762263810777
  implements MigrationInterface
{
  name = 'CreateExamSchedulesTable1762263810777';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "exam_schedules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "examDate" DATE NOT NULL,
                "examSession" integer NOT NULL,
                "building" character varying(100),
                "campus" character varying(100),
                "room" character varying(100),
                "subjectCode" character varying(50),
                "sessionCode" character varying(50),
                "examType" character varying(100),
                "className" character varying(100),
                "lecturer" character varying(100),
                "department" character varying(100),
                "examiner1" character varying(100),
                "examiner2" character varying(100),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_exam_schedules_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "exam_schedules"
        `);
  }
}

