-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "file_embedding_kind" AS ENUM ('image', 'text');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_keys" (
    "key" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "upload_id" UUID,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "phash" TEXT,
    "text_excerpt" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_embeddings" (
    "file_id" UUID NOT NULL,
    "kind" "file_embedding_kind" NOT NULL,
    "embedding" vector(768),
    "embedding_img" vector(512),

    CONSTRAINT "file_embeddings_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "dedupe_groups" (
    "id" UUID NOT NULL,
    "upload_id" UUID NOT NULL,
    "group_index" INTEGER NOT NULL,
    "kept_file_id" UUID,

    CONSTRAINT "dedupe_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "license_keys_user_id_idx" ON "license_keys"("user_id");

-- CreateIndex
CREATE INDEX "license_keys_revoked_created_at_idx" ON "license_keys"("revoked", "created_at");

-- CreateIndex
CREATE INDEX "uploads_user_id_created_at_idx" ON "uploads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "files_upload_id_idx" ON "files"("upload_id");

-- CreateIndex
CREATE INDEX "files_sha256_idx" ON "files"("sha256");

-- CreateIndex
CREATE INDEX "files_phash_idx" ON "files"("phash");

-- CreateIndex
CREATE INDEX "dedupe_groups_upload_id_idx" ON "dedupe_groups"("upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "dedupe_groups_upload_id_group_index_key" ON "dedupe_groups"("upload_id", "group_index");

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_embeddings" ADD CONSTRAINT "file_embeddings_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dedupe_groups" ADD CONSTRAINT "dedupe_groups_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dedupe_groups" ADD CONSTRAINT "dedupe_groups_kept_file_id_fkey" FOREIGN KEY ("kept_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
