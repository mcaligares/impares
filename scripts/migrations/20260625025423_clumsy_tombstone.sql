ALTER TABLE "match_player" DROP CONSTRAINT "match_player_match_id_match_id_fk";--> statement-breakpoint
ALTER TABLE "squad" DROP CONSTRAINT "squad_match_id_match_id_fk";--> statement-breakpoint
ALTER TABLE "match_player" DROP CONSTRAINT "match_player_match_id_player_id_unique";--> statement-breakpoint
TRUNCATE TABLE "match_player", "squad", "match" RESTART IDENTITY;--> statement-breakpoint
ALTER TABLE "match_player" DROP COLUMN "match_id";--> statement-breakpoint
ALTER TABLE "squad" DROP COLUMN "match_id";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "match_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "match_player" ADD COLUMN "match_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "squad" ADD COLUMN "match_id" integer;--> statement-breakpoint
ALTER TABLE "match_player" ADD CONSTRAINT "match_player_match_id_player_id_unique" UNIQUE("match_id","player_id");--> statement-breakpoint
ALTER TABLE "match_player" ADD CONSTRAINT "match_player_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad" ADD CONSTRAINT "squad_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE set null ON UPDATE no action;