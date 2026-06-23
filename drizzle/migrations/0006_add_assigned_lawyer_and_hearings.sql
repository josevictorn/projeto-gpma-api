ALTER TABLE "cases"
    ADD COLUMN "assigned_lawyer_id" uuid NULL;
--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_lawyer_id_users_id_fk" FOREIGN KEY ("assigned_lawyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "hearings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "case_id" uuid NOT NULL,
    "scheduled_at" timestamp NOT NULL,
    "location" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
