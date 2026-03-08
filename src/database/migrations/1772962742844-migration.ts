import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1772962742844 implements MigrationInterface {
    name = 'Migration1772962742844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "genres" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f105f8230a83b86a346427de94d" UNIQUE ("name"), CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "actors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "profile_picture_url" character varying, "biography" text, "birth_date" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d8608598c2c4f907a78de2ae461" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movie_quality_sources_quality_enum" AS ENUM('SD_720P', 'HD_1080P', 'UHD_4K')`);
        await queryRunner.query(`CREATE TABLE "movie_quality_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "movie_id" uuid NOT NULL, "quality" "public"."movie_quality_sources_quality_enum" NOT NULL, "stream_url" character varying NOT NULL, "download_url" character varying, "file_size_mb" numeric(10,2), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0bc633a8c43c62e5ebbf93b54cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movies_rating_source_enum" AS ENUM('IMDB', 'ROTTEN_TOMATOES', 'METACRITIC')`);
        await queryRunner.query(`CREATE TYPE "public"."movies_access_level_enum" AS ENUM('limited', 'full')`);
        await queryRunner.query(`CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "synopsis" text, "thumbnail_url" character varying, "trailer_url" character varying, "release_date" date, "duration_seconds" integer, "rating_score" numeric(3,1), "rating_source" "public"."movies_rating_source_enum", "access_level" "public"."movies_access_level_enum" NOT NULL DEFAULT 'full', "is_published" boolean NOT NULL DEFAULT false, "view_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."downloaded_movies_status_enum" AS ENUM('pending', 'in_progress', 'paused', 'completed', 'failed', 'deleted')`);
        await queryRunner.query(`CREATE TYPE "public"."downloaded_movies_quality_enum" AS ENUM('SD_720P', 'HD_1080P', 'UHD_4K')`);
        await queryRunner.query(`CREATE TABLE "downloaded_movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "movie_id" uuid NOT NULL, "status" "public"."downloaded_movies_status_enum" NOT NULL DEFAULT 'pending', "quality" "public"."downloaded_movies_quality_enum" NOT NULL, "progress_percent" smallint NOT NULL DEFAULT '0', "local_file_path" character varying, "file_size_mb" numeric(10,2), "downloaded_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e5beef8ac24f6a239dff85412b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_type_enum" AS ENUM('basic', 'standard', 'premium')`);
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_quality_enum" AS ENUM('SD', 'HD', '4K_UHD')`);
        await queryRunner.query(`CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."subscription_plans_type_enum" NOT NULL, "name" character varying(100) NOT NULL, "price" numeric(10,2) NOT NULL, "billing_cycle" character varying(20) NOT NULL DEFAULT 'monthly', "quality" "public"."subscription_plans_quality_enum" NOT NULL, "max_devices" integer NOT NULL, "full_library_access" boolean NOT NULL DEFAULT false, "download_allowed" boolean NOT NULL DEFAULT false, "ads_enabled" boolean NOT NULL DEFAULT true, "priority_streaming" boolean NOT NULL DEFAULT false, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a0b884a3a9964aef2cd41fda606" UNIQUE ("type"), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('active', 'inactive', 'suspended', 'cancelled', 'trial')`);
        await queryRunner.query(`CREATE TABLE "user_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'active', "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "next_billing_date" TIMESTAMP WITH TIME ZONE NOT NULL, "cancelled_at" TIMESTAMP WITH TIME ZONE, "auto_renew" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_0641da02314913e28f6131310e" UNIQUE ("user_id"), CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_methods_cardtype_enum" AS ENUM('mastercard', 'visa', 'amex', 'other')`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "cardType" "public"."payment_methods_cardtype_enum" NOT NULL DEFAULT 'mastercard', "name_on_card" character varying(100) NOT NULL, "last_four_digits" character varying(4) NOT NULL, "expiry_month" smallint NOT NULL, "expiry_year" smallint NOT NULL, "gateway_token" character varying, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended', 'unverified')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying NOT NULL, "profile_picture_url" character varying, "status" "public"."users_status_enum" NOT NULL DEFAULT 'unverified', "otp_code" character varying(6), "otp_expires_at" TIMESTAMP WITH TIME ZONE, "otp_verified" boolean NOT NULL DEFAULT false, "reset_password_token" character varying, "reset_password_expires_at" TIMESTAMP WITH TIME ZONE, "refresh_token" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movie_genres" ("movie_id" uuid NOT NULL, "genre_id" uuid NOT NULL, CONSTRAINT "PK_ec45eae1bc95d1461ad55713ffc" PRIMARY KEY ("movie_id", "genre_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ae967ce58ef99e9ff3933ccea4" ON "movie_genres" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbbc12542564f7ff56e36f5bbf" ON "movie_genres" ("genre_id") `);
        await queryRunner.query(`CREATE TABLE "movie_actors" ("movie_id" uuid NOT NULL, "actor_id" uuid NOT NULL, CONSTRAINT "PK_71385034c67fafe3ebf8748cab9" PRIMARY KEY ("movie_id", "actor_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f6a1b0c5b2996114fe159c6874" ON "movie_actors" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6d6b6d55428c189b0f48e6a01" ON "movie_actors" ("actor_id") `);
        await queryRunner.query(`ALTER TABLE "movie_quality_sources" ADD CONSTRAINT "FK_4c163375ce9cc292ac83cb825b4" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "downloaded_movies" ADD CONSTRAINT "FK_a47478d8b286a4aa43fd3e02d9f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "downloaded_movies" ADD CONSTRAINT "FK_9886a18e1c987acdaae4ea76f58" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_0641da02314913e28f6131310eb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_fe0520c7b2c1c5792446086491f" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_genres" ADD CONSTRAINT "FK_ae967ce58ef99e9ff3933ccea48" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movie_genres" ADD CONSTRAINT "FK_bbbc12542564f7ff56e36f5bbf6" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movie_actors" ADD CONSTRAINT "FK_f6a1b0c5b2996114fe159c68744" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "movie_actors" ADD CONSTRAINT "FK_a6d6b6d55428c189b0f48e6a016" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movie_actors" DROP CONSTRAINT "FK_a6d6b6d55428c189b0f48e6a016"`);
        await queryRunner.query(`ALTER TABLE "movie_actors" DROP CONSTRAINT "FK_f6a1b0c5b2996114fe159c68744"`);
        await queryRunner.query(`ALTER TABLE "movie_genres" DROP CONSTRAINT "FK_bbbc12542564f7ff56e36f5bbf6"`);
        await queryRunner.query(`ALTER TABLE "movie_genres" DROP CONSTRAINT "FK_ae967ce58ef99e9ff3933ccea48"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_fe0520c7b2c1c5792446086491f"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_0641da02314913e28f6131310eb"`);
        await queryRunner.query(`ALTER TABLE "downloaded_movies" DROP CONSTRAINT "FK_9886a18e1c987acdaae4ea76f58"`);
        await queryRunner.query(`ALTER TABLE "downloaded_movies" DROP CONSTRAINT "FK_a47478d8b286a4aa43fd3e02d9f"`);
        await queryRunner.query(`ALTER TABLE "movie_quality_sources" DROP CONSTRAINT "FK_4c163375ce9cc292ac83cb825b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6d6b6d55428c189b0f48e6a01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f6a1b0c5b2996114fe159c6874"`);
        await queryRunner.query(`DROP TABLE "movie_actors"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbbc12542564f7ff56e36f5bbf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae967ce58ef99e9ff3933ccea4"`);
        await queryRunner.query(`DROP TABLE "movie_genres"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TYPE "public"."payment_methods_cardtype_enum"`);
        await queryRunner.query(`DROP TABLE "user_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."user_subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "subscription_plans"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_quality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_type_enum"`);
        await queryRunner.query(`DROP TABLE "downloaded_movies"`);
        await queryRunner.query(`DROP TYPE "public"."downloaded_movies_quality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."downloaded_movies_status_enum"`);
        await queryRunner.query(`DROP TABLE "movies"`);
        await queryRunner.query(`DROP TYPE "public"."movies_access_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movies_rating_source_enum"`);
        await queryRunner.query(`DROP TABLE "movie_quality_sources"`);
        await queryRunner.query(`DROP TYPE "public"."movie_quality_sources_quality_enum"`);
        await queryRunner.query(`DROP TABLE "actors"`);
        await queryRunner.query(`DROP TABLE "genres"`);
    }

}
