CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"content" jsonb,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parent_id" text,
	"workspace_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"crdt_state" jsonb
);
--> statement-breakpoint
CREATE TABLE "relations" (
	"id" text PRIMARY KEY NOT NULL,
	"from_block" text NOT NULL,
	"to_block" text NOT NULL,
	"relation_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_id_blocks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_from_block_blocks_id_fk" FOREIGN KEY ("from_block") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "relations_to_block_blocks_id_fk" FOREIGN KEY ("to_block") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blocks_parent" ON "blocks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_workspace" ON "blocks" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_type" ON "blocks" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_relations_triplet" ON "relations" USING btree ("from_block","to_block","relation_type");--> statement-breakpoint
CREATE INDEX "idx_relations_from" ON "relations" USING btree ("from_block");--> statement-breakpoint
CREATE INDEX "idx_relations_to" ON "relations" USING btree ("to_block");