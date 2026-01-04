CREATE TABLE "parcels" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"jurisdiction" varchar(255),
	"zoning" varchar(255),
	"apn" varchar(128) NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"lat" numeric(10, 8),
	"lng" numeric(11, 8),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parcels_apn_unique" UNIQUE("apn")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"account_id" varchar(128),
	"title" varchar(255) NOT NULL,
	"parcel_id" varchar(128) NOT NULL,
	"address" text,
	"jurisdiction" text,
	"status" varchar(32) DEFAULT 'ready' NOT NULL,
	"projection" jsonb,
	"branding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
