CREATE TYPE "public"."anomaly_type" AS ENUM('mismatch', 'stuck', 'no_proof');--> statement-breakpoint
CREATE TYPE "public"."case_category" AS ENUM('TIDAK_DITERIMA', 'TERTUKAR', 'RUSAK', 'STATUS_TIDAK_SESUAI', 'DITUDUH', 'LAINNYA');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('BARU', 'DIPROSES', 'PENYEBAB_DITEMUKAN', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."evidence_kind" AS ENUM('pickup', 'handover', 'unboxing', 'hub_scan');--> statement-breakpoint
CREATE TYPE "public"."evidence_owner" AS ENUM('courier', 'user');--> statement-breakpoint
CREATE TYPE "public"."evidence_source" AS ENUM('device', 'google_drive', 'courier');--> statement-breakpoint
CREATE TYPE "public"."identity_result" AS ENUM('reference', 'match', 'mismatch', 'not_scanned');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('PENGGUNA', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('pelapor', 'admin', 'sistem');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('tinggi', 'sedang', 'rendah');--> statement-breakpoint
CREATE TYPE "public"."trace_status" AS ENUM('belum', 'tidak_ada', 'ditemukan');--> statement-breakpoint
CREATE TABLE "anomalies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "anomalies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shipment_id" integer NOT NULL,
	"type" "anomaly_type" NOT NULL,
	"label" varchar(120) NOT NULL,
	"severity" "severity" NOT NULL,
	"hub" varchar(120) NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"assignee_id" integer,
	"deadline" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"case_id" integer,
	"actor_id" integer,
	"actor_label" varchar(120) NOT NULL,
	"action" varchar(60) NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_evidence" (
	"case_id" integer NOT NULL,
	"evidence_id" integer NOT NULL,
	CONSTRAINT "case_evidence_case_id_evidence_id_pk" PRIMARY KEY("case_id","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "case_validations" (
	"case_id" integer PRIMARY KEY NOT NULL,
	"damaged" boolean,
	"insurance" varchar(16),
	"charge_rule_id" integer,
	"charge_manual" integer,
	"charge_total" integer,
	"swapped" boolean,
	"found_location_id" integer,
	"redelivery_at" timestamp with time zone,
	"summary" text,
	"decision_sent_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(16) NOT NULL,
	"shipment_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"category" "case_category" NOT NULL,
	"category_other" text,
	"story_html" text NOT NULL,
	"story_text" text NOT NULL,
	"contact_channel" varchar(16) DEFAULT 'whatsapp' NOT NULL,
	"status" "case_status" DEFAULT 'BARU' NOT NULL,
	"stage_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stage_deadline" timestamp with time zone NOT NULL,
	"assignee_id" integer,
	"priority" "severity" DEFAULT 'sedang' NOT NULL,
	"cause" text,
	"refund_status" varchar(24) DEFAULT 'Belum diajukan' NOT NULL,
	"accepted_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"escalated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charge_rules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "charge_rules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" varchar(160) NOT NULL,
	"percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"flat_amount" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evidence_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shipment_id" integer NOT NULL,
	"owner_type" "evidence_owner" NOT NULL,
	"uploaded_by" integer,
	"kind" "evidence_kind" NOT NULL,
	"media_type" varchar(10) NOT NULL,
	"source" "evidence_source" NOT NULL,
	"file_name" varchar(200) NOT NULL,
	"storage_key" text,
	"mime" varchar(100),
	"size" integer DEFAULT 0,
	"duration_sec" integer,
	"sha256" varchar(64),
	"meta" text,
	"locked_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_checks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "identity_checks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shipment_id" integer NOT NULL,
	"seq" integer NOT NULL,
	"hub" varchar(120) NOT NULL,
	"checked_at" timestamp with time zone,
	"weight_kg" real,
	"length_cm" real,
	"width_cm" real,
	"height_cm" real,
	"seal_no" varchar(40),
	"result" "identity_result" NOT NULL,
	"is_first_mismatch" boolean DEFAULT false NOT NULL,
	"officer" varchar(60),
	"note" text
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "incidents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(24) NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" varchar(200) NOT NULL,
	"cause" text NOT NULL,
	"resolution_days" integer NOT NULL,
	"fix" text NOT NULL,
	"period" varchar(20) NOT NULL,
	"case_id" integer,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "internal_notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"case_id" integer NOT NULL,
	"author_id" integer,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"case_id" integer NOT NULL,
	"sender_role" "sender_role" NOT NULL,
	"sender_id" integer,
	"kind" varchar(16) DEFAULT 'chat' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "share_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"case_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipment_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shipment_id" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"kind" varchar(24) NOT NULL,
	"title" varchar(160) NOT NULL,
	"location" varchar(120),
	"actor" varchar(120),
	"method" varchar(80),
	"identity_result" "identity_result",
	"is_first_mismatch" boolean DEFAULT false NOT NULL,
	"note" text,
	"gap_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"awb" varchar(40) NOT NULL,
	"courier" varchar(40) DEFAULT 'JNE' NOT NULL,
	"service" varchar(40) DEFAULT 'Reguler' NOT NULL,
	"origin" varchar(80) NOT NULL,
	"destination" varchar(80) NOT NULL,
	"recipient_name" varchar(120) NOT NULL,
	"recipient_phone" varchar(32) NOT NULL,
	"recipient_address" text DEFAULT '' NOT NULL,
	"owner_id" integer,
	"status" varchar(40) NOT NULL,
	"status_source" varchar(80),
	"status_at" timestamp with time zone,
	"eta" timestamp with time zone,
	"eta_confidence" varchar(20) DEFAULT 'tinggi',
	"item_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "trace_locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"case_id" integer NOT NULL,
	"seq" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" "trace_status" DEFAULT 'belum' NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(32),
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'PENGGUNA' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_validations" ADD CONSTRAINT "case_validations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_validations" ADD CONSTRAINT "case_validations_charge_rule_id_charge_rules_id_fk" FOREIGN KEY ("charge_rule_id") REFERENCES "public"."charge_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_checks" ADD CONSTRAINT "identity_checks_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_locations" ADD CONSTRAINT "trace_locations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_case_idx" ON "audit_logs" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_code_idx" ON "cases" USING btree ("code");--> statement-breakpoint
CREATE INDEX "cases_status_idx" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "evidence_shipment_idx" ON "evidence" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "checks_shipment_idx" ON "identity_checks" USING btree ("shipment_id","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_code_idx" ON "incidents" USING btree ("code");--> statement-breakpoint
CREATE INDEX "messages_case_idx" ON "messages" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "share_token_idx" ON "share_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "events_shipment_idx" ON "shipment_events" USING btree ("shipment_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_awb_idx" ON "shipments" USING btree ("awb");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");