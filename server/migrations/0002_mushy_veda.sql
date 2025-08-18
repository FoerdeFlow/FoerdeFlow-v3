CREATE TYPE "public"."genders" AS ENUM('male', 'female', 'non_binary', 'diverse');--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "gender" "genders";