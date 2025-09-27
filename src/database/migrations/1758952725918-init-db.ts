import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDb1758952725918 implements MigrationInterface {
  name = 'InitDb1758952725918';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "semester_blocks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "semesterId" uuid NOT NULL,
                CONSTRAINT "PK_c26f38cf9397a1ea52114817818" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "semesters" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP NOT NULL,
                "description" text,
                "status" "public"."semesters_status_enum" NOT NULL,
                "year" integer NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_25c393e2e76b3e32e87a79b1dc2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "stages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "position" integer NOT NULL DEFAULT '0',
                "color" character varying(7),
                "stageGroup" "public"."stages_stagegroup_enum" NOT NULL DEFAULT 'active',
                "isBuiltIn" boolean NOT NULL DEFAULT false,
                "groupPosition" integer NOT NULL DEFAULT '0',
                "workspaceId" uuid NOT NULL,
                "isCompleted" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id")
            )
        `);
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
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "senderId" uuid,
                "title" character varying(255) NOT NULL,
                "message" text,
                "type" character varying(255),
                "data" json,
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "workspaceId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "username" character varying(100) NOT NULL,
                "dateOfBirth" date,
                "major" character varying(100),
                "avatar" character varying(255),
                "email" character varying(255) NOT NULL,
                "phone" character varying(20) NOT NULL,
                "role" "public"."users_role_enum" NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_assignees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."activity_assignees_role_enum" NOT NULL DEFAULT 'collaborator',
                "status" "public"."activity_assignees_status_enum" NOT NULL DEFAULT 'pending',
                "assignedAt" TIMESTAMP WITH TIME ZONE,
                "assignedBy" uuid,
                "note" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6cfedef9f7643102ab5b0dbb2b0" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_checklists" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "activityId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ff8747e9743b6d8ed1b8652ad9b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_checklist_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" character varying(255) NOT NULL,
                "isDone" boolean NOT NULL DEFAULT false,
                "checklistId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_17287f0f58f5475345da4dfe41d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_feedback" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "content" text NOT NULL,
                "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8335723db15b385af174ba7a672" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "fileUrl" character varying(255) NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_0f5c6a6c9caf5fed58f20a3e313" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activity_participants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."activity_participants_role_enum" NOT NULL,
                "status" "public"."activity_participants_status_enum" NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_81da0007c6a40519ca146023bc7" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "activities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "type" "public"."activities_type_enum" NOT NULL,
                "description" text,
                "priority" "public"."activities_priority_enum",
                "stageId" uuid,
                "startTime" TIMESTAMP WITH TIME ZONE,
                "endTime" TIMESTAMP WITH TIME ZONE,
                "location" character varying(255),
                "onlineLink" character varying(255),
                "mandatory" boolean NOT NULL DEFAULT false,
                "estimateTime" integer,
                "parentId" uuid,
                "position" integer NOT NULL DEFAULT '0',
                "workspaceId" uuid NOT NULL,
                "category" "public"."activities_category_enum",
                "status" "public"."activities_status_enum" NOT NULL DEFAULT 'new',
                "semesterId" uuid,
                "instructorCount" integer,
                "studentCount" integer,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "workspace_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspaceId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" "public"."workspace_members_role_enum" NOT NULL DEFAULT 'member',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id")
            )
        `);
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
            CREATE TABLE "workspaces" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "icon" character varying(255),
                "visibility" character varying(20) NOT NULL,
                "ownerId" uuid NOT NULL,
                "avatars" character varying(255),
                "inviteCode" character varying(32),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_a2c9d7a0bc273471872ecdbcfd9" UNIQUE ("inviteCode"),
                CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id")
            )
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
                "workspaceId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "event_feedback_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventFeedbackId" uuid NOT NULL,
                "uid" character varying(255) NOT NULL,
                "name" character varying(255) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7b6b3d3cdc5b779fe627548d119" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "event_feedback" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activityId" uuid NOT NULL,
                "email" character varying(255) NOT NULL,
                "numPhone" character varying(20),
                "fullName" character varying(255) NOT NULL,
                "studentId" character varying(50) NOT NULL,
                "rating" integer NOT NULL,
                "comments" text,
                "image" character varying(500),
                "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdBy" character varying NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_124de47cbc8a4b768709b8f00b6" UNIQUE ("activityId", "email"),
                CONSTRAINT "PK_45430c2b672fff2eef02db0fed1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_103c34798f7cd54893e6b3e5c2" ON "event_feedback" ("rating")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f4436a9cf7088f381aa9a188e6" ON "event_feedback" ("email")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2180850236cb098536a90541ff" ON "event_feedback" ("activityId")
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks"
            ADD CONSTRAINT "FK_ff112764ab1da5561a6ae089f2c" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "stages"
            ADD CONSTRAINT "FK_f91e03aadf8b2216a07210453be" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_ddb7981cf939fe620179bfea33a" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_2693bfed4c04d9ebc13d668bdff" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees"
            ADD CONSTRAINT "FK_f8addab376d11039cd3b252c8e8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists"
            ADD CONSTRAINT "FK_91574dfdc65c91224f52a6b3d68" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklist_items"
            ADD CONSTRAINT "FK_210840a4f7d614ef80cb8b73cff" FOREIGN KEY ("checklistId") REFERENCES "activity_checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD CONSTRAINT "FK_3d0f6b812759b36ed45474a7b8e" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback"
            ADD CONSTRAINT "FK_e02f7be1920f4f06a379a849f16" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files"
            ADD CONSTRAINT "FK_0bcf78b5aed931ac01b7f2a3c40" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD CONSTRAINT "FK_f86e7fd40ff60987a34c3989f1d" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants"
            ADD CONSTRAINT "FK_687058fcf49987e4680224f146a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_57e741ad87fb61aa2cd0afcc3df" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_477cf498e3c7c18dd428e821022" FOREIGN KEY ("parentId") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "activities"
            ADD CONSTRAINT "FK_49d43cdbf616c4466c39360de70" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members"
            ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_view_settings"
            ADD CONSTRAINT "FK_c41ba76e41f4dbad3d16e242e3d" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces"
            ADD CONSTRAINT "FK_77607c5b6af821ec294d33aab0c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD CONSTRAINT "FK_dccf2382a3ffe4edfc09b8eeb06" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "FK_a443b3a690edf7e690e3dace8d9" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "FK_734c779fc5d891b8572f7ff9c5e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_feedback_files"
            ADD CONSTRAINT "FK_3e6e504f746eabd9785763e1c04" FOREIGN KEY ("eventFeedbackId") REFERENCES "event_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_feedback"
            ADD CONSTRAINT "FK_2180850236cb098536a90541ff1" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "event_feedback" DROP CONSTRAINT "FK_2180850236cb098536a90541ff1"
        `);
    await queryRunner.query(`
            ALTER TABLE "event_feedback_files" DROP CONSTRAINT "FK_3e6e504f746eabd9785763e1c04"
        `);
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_734c779fc5d891b8572f7ff9c5e"
        `);
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_a443b3a690edf7e690e3dace8d9"
        `);
    await queryRunner.query(`
            ALTER TABLE "tenants" DROP CONSTRAINT "FK_dccf2382a3ffe4edfc09b8eeb06"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspaces" DROP CONSTRAINT "FK_77607c5b6af821ec294d33aab0c"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_view_settings" DROP CONSTRAINT "FK_c41ba76e41f4dbad3d16e242e3d"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"
        `);
    await queryRunner.query(`
            ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_49d43cdbf616c4466c39360de70"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_01604411bae8cb5e75bf2524ffb"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_477cf498e3c7c18dd428e821022"
        `);
    await queryRunner.query(`
            ALTER TABLE "activities" DROP CONSTRAINT "FK_57e741ad87fb61aa2cd0afcc3df"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_687058fcf49987e4680224f146a"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_f86e7fd40ff60987a34c3989f1d"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_files" DROP CONSTRAINT "FK_0bcf78b5aed931ac01b7f2a3c40"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP CONSTRAINT "FK_e02f7be1920f4f06a379a849f16"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_feedback" DROP CONSTRAINT "FK_3d0f6b812759b36ed45474a7b8e"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklist_items" DROP CONSTRAINT "FK_210840a4f7d614ef80cb8b73cff"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_checklists" DROP CONSTRAINT "FK_91574dfdc65c91224f52a6b3d68"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_f8addab376d11039cd3b252c8e8"
        `);
    await queryRunner.query(`
            ALTER TABLE "activity_assignees" DROP CONSTRAINT "FK_2693bfed4c04d9ebc13d668bdff"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_ddb7981cf939fe620179bfea33a"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"
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
            ALTER TABLE "stages" DROP CONSTRAINT "FK_f91e03aadf8b2216a07210453be"
        `);
    await queryRunner.query(`
            ALTER TABLE "semester_blocks" DROP CONSTRAINT "FK_ff112764ab1da5561a6ae089f2c"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2180850236cb098536a90541ff"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f4436a9cf7088f381aa9a188e6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_103c34798f7cd54893e6b3e5c2"
        `);
    await queryRunner.query(`
            DROP TABLE "event_feedback"
        `);
    await queryRunner.query(`
            DROP TABLE "event_feedback_files"
        `);
    await queryRunner.query(`
            DROP TABLE "files"
        `);
    await queryRunner.query(`
            DROP TABLE "device-token"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3021c18db2b363ae9324c826c5"
        `);
    await queryRunner.query(`
            DROP TABLE "tenants"
        `);
    await queryRunner.query(`
            DROP TABLE "workspaces"
        `);
    await queryRunner.query(`
            DROP TABLE "workspace_view_settings"
        `);
    await queryRunner.query(`
            DROP TABLE "workspace_members"
        `);
    await queryRunner.query(`
            DROP TABLE "activities"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_participants"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_files"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_feedback"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_checklist_items"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_checklists"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_assignees"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "notifications"
        `);
    await queryRunner.query(`
            DROP TABLE "activity_log"
        `);
    await queryRunner.query(`
            DROP TABLE "stages"
        `);
    await queryRunner.query(`
            DROP TABLE "semesters"
        `);
    await queryRunner.query(`
            DROP TABLE "semester_blocks"
        `);
  }
}
