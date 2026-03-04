create type "public"."benefit_reset_frequency" as enum ('monthly', 'quarterly', 'annual', 'none');

create type "public"."promotion_condition_type" as enum ('spend_amount', 'number_of_transactions', 'category_spend');

create type "public"."reward_calculation_type" as enum ('multiplier', 'percent', 'flat');

create type "public"."reward_currency_type" as enum ('points', 'miles', 'cash');

alter table "public"."credit_card_type" drop constraint "credit_card_type_reward_program_id_fkey";

alter table "public"."profile" drop constraint "userProfiles_auth_id_fkey";

alter table "public"."benefit" drop constraint "benefit_credit_card_type_id_fkey";

alter table "public"."credit_card" drop constraint "credit_card_credit_card_type_id_fkey";

alter table "public"."credit_card" drop constraint "credit_card_profile_id_fkey";

alter table "public"."credit_card_type" drop constraint "credit_card_type_issuer_id_fkey";

alter table "public"."credit_card_type" drop constraint "credit_card_type_network_id_fkey";

alter table "public"."note" drop constraint "note_credit_card_id_fkey";

alter table "public"."promotion" drop constraint "promotion_credit_card_type_id_fkey";

alter table "public"."promotion_condition" drop constraint "promotion_condition_promotion_id_fkey";

alter table "public"."promotion_reward" drop constraint "promotion_reward_promotion_id_fkey";

alter table "public"."reward" drop constraint "reward_credit_card_type_id_fkey";


  create table "public"."spending_category" (
    "spending_category_id" uuid not null default gen_random_uuid(),
    "name" character varying not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."spending_category" enable row level security;

alter table "public"."benefit" drop column "expiration_policy";

alter table "public"."benefit" add column "value_unit" character varying;

alter table "public"."benefit" alter column "credit_card_type_id" set not null;

alter table "public"."benefit" alter column "reset_frequency" set default 'none'::public.benefit_reset_frequency;

alter table "public"."benefit" alter column "reset_frequency" set data type public.benefit_reset_frequency using "reset_frequency"::public.benefit_reset_frequency;

alter table "public"."credit_card" drop column "credit_limit";

alter table "public"."credit_card" alter column "last_four" drop not null;

alter table "public"."credit_card" alter column "updated_at" drop not null;

alter table "public"."credit_card_type" drop column "reward_program_id";

alter table "public"."credit_card_type" drop column "reward_structure_summary";

alter table "public"."credit_card_type" add column "reward_currency_type" public.reward_currency_type not null default 'points'::public.reward_currency_type;

alter table "public"."credit_card_type" alter column "annual_fee" drop not null;

alter table "public"."credit_card_type" alter column "image_url" set data type text using "image_url"::text;

alter table "public"."issuer" alter column "logo_url" set data type text using "logo_url"::text;

alter table "public"."issuer" alter column "website_url" set data type text using "website_url"::text;

alter table "public"."note" alter column "content" set not null;

alter table "public"."promotion_condition" drop column "category";

alter table "public"."promotion_condition" drop column "threshold_amount";

alter table "public"."promotion_condition" drop column "threshold_unit";

alter table "public"."promotion_condition" add column "goal_amount" numeric not null;

alter table "public"."promotion_condition" add column "spending_category_id" uuid default gen_random_uuid();

alter table "public"."promotion_condition" alter column "condition_type" set default 'spend_amount'::public.promotion_condition_type;

alter table "public"."promotion_condition" alter column "condition_type" set data type public.promotion_condition_type using "condition_type"::public.promotion_condition_type;

alter table "public"."promotion_condition" alter column "time_period_days" set not null;

alter table "public"."promotion_reward" drop column "reward_type";

alter table "public"."promotion_reward" drop column "reward_unit";

alter table "public"."promotion_reward" add column "reward_currency" public.reward_currency_type not null default 'points'::public.reward_currency_type;

alter table "public"."promotion_reward" alter column "cap_period" set data type bigint using "cap_period"::bigint;

alter table "public"."promotion_reward" alter column "notes" set data type text using "notes"::text;

alter table "public"."promotion_reward" alter column "reward_amount" set default 0.0;

alter table "public"."promotion_reward" alter column "reward_amount" set not null;

alter table "public"."reward" drop column "category";

alter table "public"."reward" drop column "multiplier";

alter table "public"."reward" drop column "reward_rate";

alter table "public"."reward" add column "reward_calculation_type" public.reward_calculation_type not null default 'percent'::public.reward_calculation_type;

alter table "public"."reward" add column "reward_currency" public.reward_currency_type not null default 'points'::public.reward_currency_type;

alter table "public"."reward" add column "reward_value" numeric not null default '0'::numeric;

alter table "public"."reward" add column "spending_category_id" uuid default gen_random_uuid();

alter table "public"."reward" alter column "cap_period" set data type bigint using "cap_period"::bigint;

CREATE UNIQUE INDEX credit_card_type_name_key ON public.credit_card_type USING btree (name);

CREATE UNIQUE INDEX spending_category_name_key ON public.spending_category USING btree (name);

CREATE UNIQUE INDEX spending_category_pkey ON public.spending_category USING btree (spending_category_id);

alter table "public"."spending_category" add constraint "spending_category_pkey" PRIMARY KEY using index "spending_category_pkey";

alter table "public"."credit_card_type" add constraint "credit_card_type_name_key" UNIQUE using index "credit_card_type_name_key";

alter table "public"."profile" add constraint "profile_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profile" validate constraint "profile_auth_id_fkey";

alter table "public"."promotion_condition" add constraint "promotion_condition_spending_category_id_fkey" FOREIGN KEY (spending_category_id) REFERENCES public.spending_category(spending_category_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."promotion_condition" validate constraint "promotion_condition_spending_category_id_fkey";

alter table "public"."reward" add constraint "reward_spending_category_id_fkey" FOREIGN KEY (spending_category_id) REFERENCES public.spending_category(spending_category_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."reward" validate constraint "reward_spending_category_id_fkey";

alter table "public"."spending_category" add constraint "spending_category_name_key" UNIQUE using index "spending_category_name_key";

alter table "public"."benefit" add constraint "benefit_credit_card_type_id_fkey" FOREIGN KEY (credit_card_type_id) REFERENCES public.credit_card_type(credit_card_type_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."benefit" validate constraint "benefit_credit_card_type_id_fkey";

alter table "public"."credit_card" add constraint "credit_card_credit_card_type_id_fkey" FOREIGN KEY (credit_card_type_id) REFERENCES public.credit_card_type(credit_card_type_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."credit_card" validate constraint "credit_card_credit_card_type_id_fkey";

alter table "public"."credit_card" add constraint "credit_card_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profile(profile_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."credit_card" validate constraint "credit_card_profile_id_fkey";

alter table "public"."credit_card_type" add constraint "credit_card_type_issuer_id_fkey" FOREIGN KEY (issuer_id) REFERENCES public.issuer(issuer_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."credit_card_type" validate constraint "credit_card_type_issuer_id_fkey";

alter table "public"."credit_card_type" add constraint "credit_card_type_network_id_fkey" FOREIGN KEY (network_id) REFERENCES public.network(network_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."credit_card_type" validate constraint "credit_card_type_network_id_fkey";

alter table "public"."note" add constraint "note_credit_card_id_fkey" FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(credit_card_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."note" validate constraint "note_credit_card_id_fkey";

alter table "public"."promotion" add constraint "promotion_credit_card_type_id_fkey" FOREIGN KEY (credit_card_type_id) REFERENCES public.credit_card_type(credit_card_type_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."promotion" validate constraint "promotion_credit_card_type_id_fkey";

alter table "public"."promotion_condition" add constraint "promotion_condition_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotion(promotion_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."promotion_condition" validate constraint "promotion_condition_promotion_id_fkey";

alter table "public"."promotion_reward" add constraint "promotion_reward_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotion(promotion_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."promotion_reward" validate constraint "promotion_reward_promotion_id_fkey";

alter table "public"."reward" add constraint "reward_credit_card_type_id_fkey" FOREIGN KEY (credit_card_type_id) REFERENCES public.credit_card_type(credit_card_type_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward" validate constraint "reward_credit_card_type_id_fkey";

grant delete on table "public"."spending_category" to "anon";

grant insert on table "public"."spending_category" to "anon";

grant references on table "public"."spending_category" to "anon";

grant select on table "public"."spending_category" to "anon";

grant trigger on table "public"."spending_category" to "anon";

grant truncate on table "public"."spending_category" to "anon";

grant update on table "public"."spending_category" to "anon";

grant delete on table "public"."spending_category" to "authenticated";

grant insert on table "public"."spending_category" to "authenticated";

grant references on table "public"."spending_category" to "authenticated";

grant select on table "public"."spending_category" to "authenticated";

grant trigger on table "public"."spending_category" to "authenticated";

grant truncate on table "public"."spending_category" to "authenticated";

grant update on table "public"."spending_category" to "authenticated";

grant delete on table "public"."spending_category" to "service_role";

grant insert on table "public"."spending_category" to "service_role";

grant references on table "public"."spending_category" to "service_role";

grant select on table "public"."spending_category" to "service_role";

grant trigger on table "public"."spending_category" to "service_role";

grant truncate on table "public"."spending_category" to "service_role";

grant update on table "public"."spending_category" to "service_role";


