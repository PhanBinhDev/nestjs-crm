import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstructorAndStudentCountToActivity1758891231037 implements MigrationInterface {
    name = 'AddInstructorAndStudentCountToActivity1758891231037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "instructorCount" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "activities"
            ADD "studentCount" integer
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "studentCount"
        `);
        await queryRunner.query(`
            ALTER TABLE "activities" DROP COLUMN "instructorCount"
        `);
    }

}
