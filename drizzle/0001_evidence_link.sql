ALTER TYPE "public"."evidence_source" ADD VALUE 'link';--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "url" text;