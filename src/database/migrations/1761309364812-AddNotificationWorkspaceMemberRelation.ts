import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationWorkspaceMemberRelation1761309364812 implements MigrationInterface {
  name = 'AddNotificationWorkspaceMemberRelation1761309364812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm cột workspaceMemberId vào bảng notifications
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD COLUMN "workspaceMemberId" uuid NULL
    `);

    // Tạo index cho cột mới
    await queryRunner.query(`
      CREATE INDEX "idx_notification_workspace_member" ON "notifications" ("workspaceMemberId")
    `);

    // Thêm foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notification_workspace_member" 
      FOREIGN KEY ("workspaceMemberId") 
      REFERENCES "workspace_members"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Cập nhật dữ liệu hiện tại: liên kết notifications với workspace_members
    await queryRunner.query(`
      UPDATE "notifications" 
      SET "workspaceMemberId" = wm.id
      FROM "workspace_members" wm
      WHERE "notifications"."type" = 'workspace'
        AND "notifications"."userId" = wm."userId"
        AND "notifications"."data"->>'workspaceId' = wm."workspaceId"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      DROP CONSTRAINT "FK_notification_workspace_member"
    `);

    // Xóa index
    await queryRunner.query(`
      DROP INDEX "idx_notification_workspace_member"
    `);

    // Xóa cột workspaceMemberId
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      DROP COLUMN "workspaceMemberId"
    `);
  }
}
