import { MigrationInterface, QueryRunner } from 'typeorm';

export class StageSeeder1754120944219 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stages = [
      { title: 'Leads', position: 0 },
      { title: 'Discovery', position: 1 },
      { title: 'Demo', position: 2 },
      { title: 'Won', position: 3 },
    ];

    for (const stage of stages) {
      await queryRunner.query(
        `INSERT INTO "stages" ("title", "position", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())`,
        [stage.title, stage.position],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "stages" WHERE "title" IN ('Leads', 'Discovery', 'Demo', 'Won')`,
    );
  }
}
