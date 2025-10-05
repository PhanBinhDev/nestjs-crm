import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserCommentsTable1759673476828
  implements MigrationInterface
{
  name = 'CreateUserCommentsTable1759673476828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_activity_files_activity"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_activity_files_file"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."activity_comment_reactions_type_enum" AS ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry')
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_comment_reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "commentId" uuid NOT NULL,
                "type" "public"."activity_comment_reactions_type_enum" NOT NULL DEFAULT 'like',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_user_comment_reaction" UNIQUE ("userId", "commentId"),
                CONSTRAINT "PK_f4a1b4257ce62e419848fe82914" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_comment_reaction_comment" ON "activity_comment_reactions" ("commentId")
        `);
    await queryRunner.query(`
            CREATE INDEX "idx_comment_reaction_user" ON "activity_comment_reactions" ("userId")
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comments" DROP COLUMN "reactions"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comment_reactions"
            ADD CONSTRAINT "FK_e2eec437323ff4212f55e1e64d7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comment_reactions"
            ADD CONSTRAINT "FK_44987835df15d5f93cf7136d416" FOREIGN KEY ("commentId") REFERENCES "activity_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_0bcf78b5aed931ac01b7f2a3c40" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_137667d12e0a683a97f0f5cf96d" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_137667d12e0a683a97f0f5cf96d"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_0bcf78b5aed931ac01b7f2a3c40"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comment_reactions" DROP CONSTRAINT "FK_44987835df15d5f93cf7136d416"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comment_reactions" DROP CONSTRAINT "FK_e2eec437323ff4212f55e1e64d7"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_comments"
            ADD "reactions" jsonb
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_comment_reaction_user"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."idx_comment_reaction_comment"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_comment_reactions"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."activity_comment_reactions_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_activity_files_file" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_activity_files_activity" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
