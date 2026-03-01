


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."benefit" (
    "benefit_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_card_type_id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" character varying NOT NULL,
    "description" "text",
    "value_amount" numeric,
    "reset_frequency" character varying,
    "expiration_policy" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."benefit" OWNER TO "postgres";


COMMENT ON TABLE "public"."benefit" IS 'Represents non-incentive credits or features associated with a credit card type (e.g. travel credit, lounge access).';



CREATE TABLE IF NOT EXISTS "public"."credit_card" (
    "credit_card_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_card_type_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nickname" character varying,
    "last_four" character varying NOT NULL,
    "credit_limit" numeric,
    "open_date" "date",
    "expiration_date" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_card" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_card" IS 'Represents a predefined credit card product from the supported subset of cards.';



CREATE TABLE IF NOT EXISTS "public"."credit_card_type" (
    "credit_card_type_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "issuer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "network_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "annual_fee" numeric DEFAULT '0'::numeric NOT NULL,
    "description" "text",
    "reward_structure_summary" "text",
    "image_url" character varying,
    "reward_program_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_card_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issuer" (
    "issuer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "website_url" character varying,
    "support_phone" character varying,
    "logo_url" character varying,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."issuer" OWNER TO "postgres";


COMMENT ON TABLE "public"."issuer" IS 'Represents  financial institutions that issue credit cards (e.g. Chase, Bank of America, American Express)';



CREATE TABLE IF NOT EXISTS "public"."network" (
    "network_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."network" OWNER TO "postgres";


COMMENT ON TABLE "public"."network" IS 'Represents payment processing networks used by credit cards (e.g. Visa, Mastercard, American Express).';



CREATE TABLE IF NOT EXISTS "public"."note" (
    "note_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_card_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."note" OWNER TO "postgres";


COMMENT ON TABLE "public"."note" IS 'Represents user-created comments or annotations associated with a credit card.';



CREATE TABLE IF NOT EXISTS "public"."profile" (
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" character varying NOT NULL,
    "last_name" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "birth_date" "date" NOT NULL
);


ALTER TABLE "public"."profile" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile" IS 'Represents application specific profile information (e.g. name, preferences) and link the authenticated user to system data.';



CREATE TABLE IF NOT EXISTS "public"."promotion" (
    "promotion_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_card_type_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "promotion_category" character varying,
    "valid_from" "date",
    "valid_until" "date",
    "is_active" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotion" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotion" IS 'Represents time-limited or conditional incentives associated with a credit card type (e.g. signup bonuses, limited offers).';



CREATE TABLE IF NOT EXISTS "public"."promotion_condition" (
    "promotion_condition_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promotion_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "condition_type" character varying NOT NULL,
    "threshold_amount" numeric,
    "threshold_unit" character varying,
    "time_period_days" bigint,
    "category" character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotion_condition" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotion_condition" IS 'Represents a qualification requirement that must be satisfied to earn a promotion (e.g. min spend, time window, category requirement).';



CREATE TABLE IF NOT EXISTS "public"."promotion_reward" (
    "promotion_reward_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promotion_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reward_type" character varying,
    "reward_amount" numeric,
    "reward_unit" character varying,
    "multiplier_value" numeric,
    "cap_amount" numeric,
    "cap_period" character varying,
    "notes" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotion_reward" OWNER TO "postgres";


COMMENT ON TABLE "public"."promotion_reward" IS 'Represents the reward granted when a promotion''s conditions are satisfied (e.g. bonus points, cashback, multiplier)';



CREATE TABLE IF NOT EXISTS "public"."reward" (
    "reward_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "credit_card_type_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text",
    "category" character varying,
    "multiplier" numeric,
    "reward_rate" numeric,
    "cap_amount" numeric,
    "cap_period" numeric,
    "start_date" "date",
    "end_date" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reward" OWNER TO "postgres";


COMMENT ON TABLE "public"."reward" IS 'Represents incentive-based earning structures associated with a credit card type (e.g. cashback categories, points, multipliers).';



CREATE TABLE IF NOT EXISTS "public"."reward_program" (
    "reward_program_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_name" character varying NOT NULL,
    "unit_name" character varying NOT NULL,
    "unit_symbol" character varying,
    "expiration_policy" "text",
    "expiration_months" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reward_program" OWNER TO "postgres";


COMMENT ON TABLE "public"."reward_program" IS 'Represents a rewards system used one or more credit card type (points, cashback, miles). Defines reward currency and rules.';



ALTER TABLE ONLY "public"."benefit"
    ADD CONSTRAINT "benefit_pkey" PRIMARY KEY ("benefit_id");



ALTER TABLE ONLY "public"."credit_card"
    ADD CONSTRAINT "credit_card_pkey" PRIMARY KEY ("credit_card_id");



ALTER TABLE ONLY "public"."credit_card_type"
    ADD CONSTRAINT "credit_card_type_pkey" PRIMARY KEY ("credit_card_type_id");



ALTER TABLE ONLY "public"."issuer"
    ADD CONSTRAINT "issuer_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."issuer"
    ADD CONSTRAINT "issuer_pkey" PRIMARY KEY ("issuer_id");



ALTER TABLE ONLY "public"."network"
    ADD CONSTRAINT "network_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."network"
    ADD CONSTRAINT "network_pkey" PRIMARY KEY ("network_id");



ALTER TABLE ONLY "public"."note"
    ADD CONSTRAINT "note_pkey" PRIMARY KEY ("note_id");



ALTER TABLE ONLY "public"."promotion_condition"
    ADD CONSTRAINT "promotion_condition_pkey" PRIMARY KEY ("promotion_condition_id");



ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_pkey" PRIMARY KEY ("promotion_id");



ALTER TABLE ONLY "public"."promotion_reward"
    ADD CONSTRAINT "promotion_reward_pkey" PRIMARY KEY ("promotion_reward_id");



ALTER TABLE ONLY "public"."reward"
    ADD CONSTRAINT "reward_pkey" PRIMARY KEY ("reward_id");



ALTER TABLE ONLY "public"."reward_program"
    ADD CONSTRAINT "reward_program_pkey" PRIMARY KEY ("reward_program_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "userProfiles_auth_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "userProfiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."benefit"
    ADD CONSTRAINT "benefit_credit_card_type_id_fkey" FOREIGN KEY ("credit_card_type_id") REFERENCES "public"."credit_card_type"("credit_card_type_id");



ALTER TABLE ONLY "public"."credit_card"
    ADD CONSTRAINT "credit_card_credit_card_type_id_fkey" FOREIGN KEY ("credit_card_type_id") REFERENCES "public"."credit_card_type"("credit_card_type_id");



ALTER TABLE ONLY "public"."credit_card"
    ADD CONSTRAINT "credit_card_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("profile_id");



ALTER TABLE ONLY "public"."credit_card_type"
    ADD CONSTRAINT "credit_card_type_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuer"("issuer_id");



ALTER TABLE ONLY "public"."credit_card_type"
    ADD CONSTRAINT "credit_card_type_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."network"("network_id");



ALTER TABLE ONLY "public"."credit_card_type"
    ADD CONSTRAINT "credit_card_type_reward_program_id_fkey" FOREIGN KEY ("reward_program_id") REFERENCES "public"."reward_program"("reward_program_id");



ALTER TABLE ONLY "public"."note"
    ADD CONSTRAINT "note_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("credit_card_id");



ALTER TABLE ONLY "public"."promotion_condition"
    ADD CONSTRAINT "promotion_condition_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("promotion_id");



ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_credit_card_type_id_fkey" FOREIGN KEY ("credit_card_type_id") REFERENCES "public"."credit_card_type"("credit_card_type_id");



ALTER TABLE ONLY "public"."promotion_reward"
    ADD CONSTRAINT "promotion_reward_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("promotion_id");



ALTER TABLE ONLY "public"."reward"
    ADD CONSTRAINT "reward_credit_card_type_id_fkey" FOREIGN KEY ("credit_card_type_id") REFERENCES "public"."credit_card_type"("credit_card_type_id");



ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "userProfiles_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."benefit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_card" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_card_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issuer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."network" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_condition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promotion_reward" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reward" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reward_program" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."benefit" TO "anon";
GRANT ALL ON TABLE "public"."benefit" TO "authenticated";
GRANT ALL ON TABLE "public"."benefit" TO "service_role";



GRANT ALL ON TABLE "public"."credit_card" TO "anon";
GRANT ALL ON TABLE "public"."credit_card" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_card" TO "service_role";



GRANT ALL ON TABLE "public"."credit_card_type" TO "anon";
GRANT ALL ON TABLE "public"."credit_card_type" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_card_type" TO "service_role";



GRANT ALL ON TABLE "public"."issuer" TO "anon";
GRANT ALL ON TABLE "public"."issuer" TO "authenticated";
GRANT ALL ON TABLE "public"."issuer" TO "service_role";



GRANT ALL ON TABLE "public"."network" TO "anon";
GRANT ALL ON TABLE "public"."network" TO "authenticated";
GRANT ALL ON TABLE "public"."network" TO "service_role";



GRANT ALL ON TABLE "public"."note" TO "anon";
GRANT ALL ON TABLE "public"."note" TO "authenticated";
GRANT ALL ON TABLE "public"."note" TO "service_role";



GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";



GRANT ALL ON TABLE "public"."promotion" TO "anon";
GRANT ALL ON TABLE "public"."promotion" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion" TO "service_role";



GRANT ALL ON TABLE "public"."promotion_condition" TO "anon";
GRANT ALL ON TABLE "public"."promotion_condition" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion_condition" TO "service_role";



GRANT ALL ON TABLE "public"."promotion_reward" TO "anon";
GRANT ALL ON TABLE "public"."promotion_reward" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion_reward" TO "service_role";



GRANT ALL ON TABLE "public"."reward" TO "anon";
GRANT ALL ON TABLE "public"."reward" TO "authenticated";
GRANT ALL ON TABLE "public"."reward" TO "service_role";



GRANT ALL ON TABLE "public"."reward_program" TO "anon";
GRANT ALL ON TABLE "public"."reward_program" TO "authenticated";
GRANT ALL ON TABLE "public"."reward_program" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


