create type "public"."benefit_targeting_type" as enum ('category', 'merchant');

create type "public"."cap_period_type" as enum ('monthly', 'quarterly', 'annual');

create type "public"."promotion_category_type" as enum ('welcome_bonus', 'spend_challenge', 'limited_time');

create type "public"."reset_frequency_type" as enum ('monthly', 'annual', 'one_time');

create type "public"."reward_targeting_type" as enum ('category', 'merchant', 'base');

create type "public"."value_unit_type" as enum ('dollars', 'points', 'miles');

revoke delete on table "public"."reward_program" from "anon";

revoke insert on table "public"."reward_program" from "anon";

revoke references on table "public"."reward_program" from "anon";

revoke select on table "public"."reward_program" from "anon";

revoke trigger on table "public"."reward_program" from "anon";

revoke truncate on table "public"."reward_program" from "anon";

revoke update on table "public"."reward_program" from "anon";

revoke delete on table "public"."reward_program" from "authenticated";

revoke insert on table "public"."reward_program" from "authenticated";

revoke references on table "public"."reward_program" from "authenticated";

revoke select on table "public"."reward_program" from "authenticated";

revoke trigger on table "public"."reward_program" from "authenticated";

revoke truncate on table "public"."reward_program" from "authenticated";

revoke update on table "public"."reward_program" from "authenticated";

revoke delete on table "public"."reward_program" from "service_role";

revoke insert on table "public"."reward_program" from "service_role";

revoke references on table "public"."reward_program" from "service_role";

revoke select on table "public"."reward_program" from "service_role";

revoke trigger on table "public"."reward_program" from "service_role";

revoke truncate on table "public"."reward_program" from "service_role";

revoke update on table "public"."reward_program" from "service_role";

alter table "public"."reward" drop constraint "reward_spending_category_id_fkey";

alter table "public"."reward_program" drop constraint "reward_program_pkey";

drop index if exists "public"."reward_program_pkey";

drop table "public"."reward_program";


  create table "public"."amex_category" (
    "amex_category_id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."amex_category" enable row level security;


  create table "public"."amex_category_mcc" (
    "amex_category_id" uuid not null default gen_random_uuid(),
    "mcc_id" uuid not null default gen_random_uuid()
      );


alter table "public"."amex_category_mcc" enable row level security;


  create table "public"."benefit_merchant" (
    "benefit_merchant_id" uuid not null default gen_random_uuid(),
    "benefit_id" uuid not null default gen_random_uuid(),
    "merchant_name" text not null,
    "merchant_keyword" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."benefit_merchant" enable row level security;


  create table "public"."benefit_spending_category" (
    "benefit_id" uuid not null default gen_random_uuid(),
    "spending_category_id" uuid not null default gen_random_uuid()
      );


alter table "public"."benefit_spending_category" enable row level security;


  create table "public"."mcc" (
    "mcc_id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "description" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."mcc" enable row level security;


  create table "public"."mcc_spending_category" (
    "mcc_id" uuid not null default gen_random_uuid(),
    "spending_category_id" uuid not null default gen_random_uuid()
      );


alter table "public"."mcc_spending_category" enable row level security;


  create table "public"."reward_amex_category" (
    "reward_id" uuid not null default gen_random_uuid(),
    "amex_category_id" uuid not null default gen_random_uuid()
      );


alter table "public"."reward_amex_category" enable row level security;


  create table "public"."reward_merchant" (
    "reward_merchant_id" uuid not null default gen_random_uuid(),
    "reward_id" uuid not null default gen_random_uuid(),
    "merchant_name" text not null,
    "merchant_keyword" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reward_merchant" enable row level security;


  create table "public"."reward_spending_category" (
    "reward_id" uuid not null default gen_random_uuid(),
    "spending_category_id" uuid not null default gen_random_uuid()
      );


alter table "public"."reward_spending_category" enable row level security;


  create table "public"."transaction" (
    "transaction_id" uuid not null default gen_random_uuid(),
    "credit_card_id" uuid not null default gen_random_uuid(),
    "mcc_id" uuid not null default gen_random_uuid(),
    "transaction_date" date not null,
    "merchant_name" text not null,
    "amount" numeric not null,
    "rewards_earned" numeric not null default '0'::numeric,
    "rewards_currency" public.reward_currency_type not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transaction" enable row level security;


  create table "public"."transaction_benefit" (
    "transaction_benefit_id" uuid not null default gen_random_uuid(),
    "transaction_id" uuid not null default gen_random_uuid(),
    "benefit_id" uuid not null default gen_random_uuid(),
    "amount_applied" numeric not null
      );


alter table "public"."transaction_benefit" enable row level security;


  create table "public"."user_benefit" (
    "user_benefit_id" uuid not null default gen_random_uuid(),
    "credit_card_id" uuid not null default gen_random_uuid(),
    "benefit_id" uuid not null default gen_random_uuid(),
    "cycle_start_date" date not null,
    "amount_used" numeric not null default '0'::numeric,
    "initial_amount_used" numeric not null default '0'::numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_benefit" enable row level security;


  create table "public"."user_benefit_entry" (
    "user_benefit_entry_id" uuid not null default gen_random_uuid(),
    "user_benefit_id" uuid not null default gen_random_uuid(),
    "usage_date" date not null,
    "merchant_name" text,
    "amount" numeric not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_benefit_entry" enable row level security;


  create table "public"."user_promotion" (
    "user_promotion_id" uuid not null default gen_random_uuid(),
    "credit_card_id" uuid not null default gen_random_uuid(),
    "promotion_id" uuid not null default gen_random_uuid(),
    "start_date" date not null,
    "end_date" date not null,
    "spend_to_date" numeric not null default '0'::numeric,
    "initial_spend" numeric not null default '0'::numeric,
    "completed_at" timestamp with time zone,
    "award_earned" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_promotion" enable row level security;

alter table "public"."reward" alter column reward_calculation_type type "public"."reward_calculation_type" using reward_calculation_type::text::"public"."reward_calculation_type";

alter table "public"."reward" alter column reward_currency type "public"."reward_currency_type" using reward_currency::text::"public"."reward_currency_type";

alter table "public"."benefit" add column "targeting_type" public.benefit_targeting_type not null;

alter table "public"."benefit" alter column "name" set data type text using "name"::text;

alter table "public"."benefit" alter column "reset_frequency" drop default;

alter table "public"."benefit" alter column "reset_frequency" set not null;

alter table "public"."benefit" alter column "reset_frequency" set data type public.reset_frequency_type using "reset_frequency"::text::public.reset_frequency_type;

alter table "public"."benefit" alter column "value_amount" set not null;

alter table "public"."benefit" alter column "value_unit" set not null;

alter table "public"."benefit" alter column "value_unit" set data type public.value_unit_type using "value_unit"::public.value_unit_type;

alter table "public"."credit_card" add column "initial_rewards_balance" numeric default '0'::numeric;

alter table "public"."credit_card" add column "statement_close_day" integer;

alter table "public"."credit_card" add column "tracking_start_date" date not null default now();

alter table "public"."credit_card" alter column "expiration_date" set not null;

alter table "public"."credit_card" alter column "last_four" set not null;

alter table "public"."credit_card" alter column "last_four" set data type text using "last_four"::text;

alter table "public"."credit_card" alter column "nickname" set data type text using "nickname"::text;

alter table "public"."credit_card" alter column "open_date" set not null;

alter table "public"."credit_card" alter column "updated_at" set not null;

alter table "public"."credit_card_type" add column "cash_value_per_unit" numeric;

alter table "public"."credit_card_type" add column "reward_unit_name" text;

alter table "public"."credit_card_type" add column "reward_unit_symbol" text;

alter table "public"."credit_card_type" alter column "annual_fee" set not null;

alter table "public"."credit_card_type" alter column "name" set data type text using "name"::text;

alter table "public"."note" alter column "updated_at" set not null;

alter table "public"."promotion" alter column "is_active" set default true;

alter table "public"."promotion" alter column "name" set data type text using "name"::text;

alter table "public"."promotion" alter column "promotion_category" set data type public.promotion_category_type using "promotion_category"::public.promotion_category_type;

alter table "public"."promotion_reward" alter column "cap_period" set data type public.cap_period_type using "cap_period"::public.cap_period_type;

alter table "public"."reward" drop column "spending_category_id";

alter table "public"."reward" add column "targeting_type" public.reward_targeting_type not null;

alter table "public"."reward" alter column "description" set not null;

alter table "public"."reward" alter column "reward_calculation_type" drop default;

alter table "public"."reward" alter column "reward_currency" drop default;

drop type "public"."benefit_reset_frequency";

CREATE UNIQUE INDEX amex_category_mcc_pkey ON public.amex_category_mcc USING btree (amex_category_id, mcc_id);

CREATE UNIQUE INDEX amex_category_name_key ON public.amex_category USING btree (name);

CREATE UNIQUE INDEX amex_category_pkey ON public.amex_category USING btree (amex_category_id);

CREATE UNIQUE INDEX benefit_merchant_pkey ON public.benefit_merchant USING btree (benefit_merchant_id);

CREATE UNIQUE INDEX benefit_spending_category_pkey ON public.benefit_spending_category USING btree (benefit_id, spending_category_id);

CREATE UNIQUE INDEX mcc_code_key ON public.mcc USING btree (code);

CREATE UNIQUE INDEX mcc_pkey ON public.mcc USING btree (mcc_id);

CREATE UNIQUE INDEX mcc_spending_category_pkey ON public.mcc_spending_category USING btree (mcc_id, spending_category_id);

CREATE UNIQUE INDEX reward_amex_category_pkey ON public.reward_amex_category USING btree (reward_id, amex_category_id);

CREATE UNIQUE INDEX reward_merchant_pkey ON public.reward_merchant USING btree (reward_merchant_id);

CREATE UNIQUE INDEX reward_spending_category_pkey ON public.reward_spending_category USING btree (reward_id, spending_category_id);

CREATE UNIQUE INDEX transaction_benefit_pkey ON public.transaction_benefit USING btree (transaction_benefit_id);

CREATE UNIQUE INDEX transaction_pkey ON public.transaction USING btree (transaction_id);

CREATE UNIQUE INDEX user_benefit_entry_pkey ON public.user_benefit_entry USING btree (user_benefit_entry_id);

CREATE UNIQUE INDEX user_benefit_pkey ON public.user_benefit USING btree (user_benefit_id);

CREATE UNIQUE INDEX user_promotion_pkey ON public.user_promotion USING btree (user_promotion_id);

alter table "public"."amex_category" add constraint "amex_category_pkey" PRIMARY KEY using index "amex_category_pkey";

alter table "public"."amex_category_mcc" add constraint "amex_category_mcc_pkey" PRIMARY KEY using index "amex_category_mcc_pkey";

alter table "public"."benefit_merchant" add constraint "benefit_merchant_pkey" PRIMARY KEY using index "benefit_merchant_pkey";

alter table "public"."benefit_spending_category" add constraint "benefit_spending_category_pkey" PRIMARY KEY using index "benefit_spending_category_pkey";

alter table "public"."mcc" add constraint "mcc_pkey" PRIMARY KEY using index "mcc_pkey";

alter table "public"."mcc_spending_category" add constraint "mcc_spending_category_pkey" PRIMARY KEY using index "mcc_spending_category_pkey";

alter table "public"."reward_amex_category" add constraint "reward_amex_category_pkey" PRIMARY KEY using index "reward_amex_category_pkey";

alter table "public"."reward_merchant" add constraint "reward_merchant_pkey" PRIMARY KEY using index "reward_merchant_pkey";

alter table "public"."reward_spending_category" add constraint "reward_spending_category_pkey" PRIMARY KEY using index "reward_spending_category_pkey";

alter table "public"."transaction" add constraint "transaction_pkey" PRIMARY KEY using index "transaction_pkey";

alter table "public"."transaction_benefit" add constraint "transaction_benefit_pkey" PRIMARY KEY using index "transaction_benefit_pkey";

alter table "public"."user_benefit" add constraint "user_benefit_pkey" PRIMARY KEY using index "user_benefit_pkey";

alter table "public"."user_benefit_entry" add constraint "user_benefit_entry_pkey" PRIMARY KEY using index "user_benefit_entry_pkey";

alter table "public"."user_promotion" add constraint "user_promotion_pkey" PRIMARY KEY using index "user_promotion_pkey";

alter table "public"."amex_category" add constraint "amex_category_name_key" UNIQUE using index "amex_category_name_key";

alter table "public"."amex_category_mcc" add constraint "amex_category_mcc_amex_category_id_fkey" FOREIGN KEY (amex_category_id) REFERENCES public.amex_category(amex_category_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."amex_category_mcc" validate constraint "amex_category_mcc_amex_category_id_fkey";

alter table "public"."amex_category_mcc" add constraint "amex_category_mcc_mcc_id_fkey" FOREIGN KEY (mcc_id) REFERENCES public.mcc(mcc_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."amex_category_mcc" validate constraint "amex_category_mcc_mcc_id_fkey";

alter table "public"."benefit_merchant" add constraint "benefit_merchant_benefit_id_fkey" FOREIGN KEY (benefit_id) REFERENCES public.benefit(benefit_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."benefit_merchant" validate constraint "benefit_merchant_benefit_id_fkey";

alter table "public"."benefit_spending_category" add constraint "benefit_spending_category_benefit_id_fkey" FOREIGN KEY (benefit_id) REFERENCES public.benefit(benefit_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."benefit_spending_category" validate constraint "benefit_spending_category_benefit_id_fkey";

alter table "public"."benefit_spending_category" add constraint "benefit_spending_category_spending_category_id_fkey" FOREIGN KEY (spending_category_id) REFERENCES public.spending_category(spending_category_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."benefit_spending_category" validate constraint "benefit_spending_category_spending_category_id_fkey";

alter table "public"."mcc" add constraint "mcc_code_key" UNIQUE using index "mcc_code_key";

alter table "public"."mcc_spending_category" add constraint "mcc_spending_category_mcc_id_fkey" FOREIGN KEY (mcc_id) REFERENCES public.mcc(mcc_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mcc_spending_category" validate constraint "mcc_spending_category_mcc_id_fkey";

alter table "public"."mcc_spending_category" add constraint "mcc_spending_category_spending_category_id_fkey" FOREIGN KEY (spending_category_id) REFERENCES public.spending_category(spending_category_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mcc_spending_category" validate constraint "mcc_spending_category_spending_category_id_fkey";

alter table "public"."reward_amex_category" add constraint "reward_amex_category_amex_category_id_fkey" FOREIGN KEY (amex_category_id) REFERENCES public.amex_category(amex_category_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_amex_category" validate constraint "reward_amex_category_amex_category_id_fkey";

alter table "public"."reward_amex_category" add constraint "reward_amex_category_reward_id_fkey" FOREIGN KEY (reward_id) REFERENCES public.reward(reward_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_amex_category" validate constraint "reward_amex_category_reward_id_fkey";

alter table "public"."reward_merchant" add constraint "reward_merchant_reward_id_fkey" FOREIGN KEY (reward_id) REFERENCES public.reward(reward_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_merchant" validate constraint "reward_merchant_reward_id_fkey";

alter table "public"."reward_spending_category" add constraint "reward_spending_category_reward_id_fkey" FOREIGN KEY (reward_id) REFERENCES public.reward(reward_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_spending_category" validate constraint "reward_spending_category_reward_id_fkey";

alter table "public"."reward_spending_category" add constraint "reward_spending_category_spending_category_id_fkey" FOREIGN KEY (spending_category_id) REFERENCES public.spending_category(spending_category_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_spending_category" validate constraint "reward_spending_category_spending_category_id_fkey";

alter table "public"."transaction" add constraint "transaction_credit_card_id_fkey" FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(credit_card_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."transaction" validate constraint "transaction_credit_card_id_fkey";

alter table "public"."transaction" add constraint "transaction_mcc_id_fkey" FOREIGN KEY (mcc_id) REFERENCES public.mcc(mcc_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."transaction" validate constraint "transaction_mcc_id_fkey";

alter table "public"."transaction_benefit" add constraint "transaction_benefit_benefit_id_fkey" FOREIGN KEY (benefit_id) REFERENCES public.benefit(benefit_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."transaction_benefit" validate constraint "transaction_benefit_benefit_id_fkey";

alter table "public"."transaction_benefit" add constraint "transaction_benefit_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."transaction_benefit" validate constraint "transaction_benefit_transaction_id_fkey";

alter table "public"."user_benefit" add constraint "user_benefit_benefit_id_fkey" FOREIGN KEY (benefit_id) REFERENCES public.benefit(benefit_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_benefit" validate constraint "user_benefit_benefit_id_fkey";

alter table "public"."user_benefit" add constraint "user_benefit_credit_card_id_fkey" FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(credit_card_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_benefit" validate constraint "user_benefit_credit_card_id_fkey";

alter table "public"."user_benefit_entry" add constraint "user_benefit_entry_user_benefit_id_fkey" FOREIGN KEY (user_benefit_id) REFERENCES public.user_benefit(user_benefit_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_benefit_entry" validate constraint "user_benefit_entry_user_benefit_id_fkey";

alter table "public"."user_promotion" add constraint "user_promotion_credit_card_id_fkey" FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(credit_card_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_promotion" validate constraint "user_promotion_credit_card_id_fkey";

alter table "public"."user_promotion" add constraint "user_promotion_promotion_id_fkey" FOREIGN KEY (promotion_id) REFERENCES public.promotion(promotion_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_promotion" validate constraint "user_promotion_promotion_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$function$
;

grant delete on table "public"."amex_category" to "anon";

grant insert on table "public"."amex_category" to "anon";

grant references on table "public"."amex_category" to "anon";

grant select on table "public"."amex_category" to "anon";

grant trigger on table "public"."amex_category" to "anon";

grant truncate on table "public"."amex_category" to "anon";

grant update on table "public"."amex_category" to "anon";

grant delete on table "public"."amex_category" to "authenticated";

grant insert on table "public"."amex_category" to "authenticated";

grant references on table "public"."amex_category" to "authenticated";

grant select on table "public"."amex_category" to "authenticated";

grant trigger on table "public"."amex_category" to "authenticated";

grant truncate on table "public"."amex_category" to "authenticated";

grant update on table "public"."amex_category" to "authenticated";

grant delete on table "public"."amex_category" to "service_role";

grant insert on table "public"."amex_category" to "service_role";

grant references on table "public"."amex_category" to "service_role";

grant select on table "public"."amex_category" to "service_role";

grant trigger on table "public"."amex_category" to "service_role";

grant truncate on table "public"."amex_category" to "service_role";

grant update on table "public"."amex_category" to "service_role";

grant delete on table "public"."amex_category_mcc" to "anon";

grant insert on table "public"."amex_category_mcc" to "anon";

grant references on table "public"."amex_category_mcc" to "anon";

grant select on table "public"."amex_category_mcc" to "anon";

grant trigger on table "public"."amex_category_mcc" to "anon";

grant truncate on table "public"."amex_category_mcc" to "anon";

grant update on table "public"."amex_category_mcc" to "anon";

grant delete on table "public"."amex_category_mcc" to "authenticated";

grant insert on table "public"."amex_category_mcc" to "authenticated";

grant references on table "public"."amex_category_mcc" to "authenticated";

grant select on table "public"."amex_category_mcc" to "authenticated";

grant trigger on table "public"."amex_category_mcc" to "authenticated";

grant truncate on table "public"."amex_category_mcc" to "authenticated";

grant update on table "public"."amex_category_mcc" to "authenticated";

grant delete on table "public"."amex_category_mcc" to "service_role";

grant insert on table "public"."amex_category_mcc" to "service_role";

grant references on table "public"."amex_category_mcc" to "service_role";

grant select on table "public"."amex_category_mcc" to "service_role";

grant trigger on table "public"."amex_category_mcc" to "service_role";

grant truncate on table "public"."amex_category_mcc" to "service_role";

grant update on table "public"."amex_category_mcc" to "service_role";

grant delete on table "public"."benefit_merchant" to "anon";

grant insert on table "public"."benefit_merchant" to "anon";

grant references on table "public"."benefit_merchant" to "anon";

grant select on table "public"."benefit_merchant" to "anon";

grant trigger on table "public"."benefit_merchant" to "anon";

grant truncate on table "public"."benefit_merchant" to "anon";

grant update on table "public"."benefit_merchant" to "anon";

grant delete on table "public"."benefit_merchant" to "authenticated";

grant insert on table "public"."benefit_merchant" to "authenticated";

grant references on table "public"."benefit_merchant" to "authenticated";

grant select on table "public"."benefit_merchant" to "authenticated";

grant trigger on table "public"."benefit_merchant" to "authenticated";

grant truncate on table "public"."benefit_merchant" to "authenticated";

grant update on table "public"."benefit_merchant" to "authenticated";

grant delete on table "public"."benefit_merchant" to "service_role";

grant insert on table "public"."benefit_merchant" to "service_role";

grant references on table "public"."benefit_merchant" to "service_role";

grant select on table "public"."benefit_merchant" to "service_role";

grant trigger on table "public"."benefit_merchant" to "service_role";

grant truncate on table "public"."benefit_merchant" to "service_role";

grant update on table "public"."benefit_merchant" to "service_role";

grant delete on table "public"."benefit_spending_category" to "anon";

grant insert on table "public"."benefit_spending_category" to "anon";

grant references on table "public"."benefit_spending_category" to "anon";

grant select on table "public"."benefit_spending_category" to "anon";

grant trigger on table "public"."benefit_spending_category" to "anon";

grant truncate on table "public"."benefit_spending_category" to "anon";

grant update on table "public"."benefit_spending_category" to "anon";

grant delete on table "public"."benefit_spending_category" to "authenticated";

grant insert on table "public"."benefit_spending_category" to "authenticated";

grant references on table "public"."benefit_spending_category" to "authenticated";

grant select on table "public"."benefit_spending_category" to "authenticated";

grant trigger on table "public"."benefit_spending_category" to "authenticated";

grant truncate on table "public"."benefit_spending_category" to "authenticated";

grant update on table "public"."benefit_spending_category" to "authenticated";

grant delete on table "public"."benefit_spending_category" to "service_role";

grant insert on table "public"."benefit_spending_category" to "service_role";

grant references on table "public"."benefit_spending_category" to "service_role";

grant select on table "public"."benefit_spending_category" to "service_role";

grant trigger on table "public"."benefit_spending_category" to "service_role";

grant truncate on table "public"."benefit_spending_category" to "service_role";

grant update on table "public"."benefit_spending_category" to "service_role";

grant delete on table "public"."mcc" to "anon";

grant insert on table "public"."mcc" to "anon";

grant references on table "public"."mcc" to "anon";

grant select on table "public"."mcc" to "anon";

grant trigger on table "public"."mcc" to "anon";

grant truncate on table "public"."mcc" to "anon";

grant update on table "public"."mcc" to "anon";

grant delete on table "public"."mcc" to "authenticated";

grant insert on table "public"."mcc" to "authenticated";

grant references on table "public"."mcc" to "authenticated";

grant select on table "public"."mcc" to "authenticated";

grant trigger on table "public"."mcc" to "authenticated";

grant truncate on table "public"."mcc" to "authenticated";

grant update on table "public"."mcc" to "authenticated";

grant delete on table "public"."mcc" to "service_role";

grant insert on table "public"."mcc" to "service_role";

grant references on table "public"."mcc" to "service_role";

grant select on table "public"."mcc" to "service_role";

grant trigger on table "public"."mcc" to "service_role";

grant truncate on table "public"."mcc" to "service_role";

grant update on table "public"."mcc" to "service_role";

grant delete on table "public"."mcc_spending_category" to "anon";

grant insert on table "public"."mcc_spending_category" to "anon";

grant references on table "public"."mcc_spending_category" to "anon";

grant select on table "public"."mcc_spending_category" to "anon";

grant trigger on table "public"."mcc_spending_category" to "anon";

grant truncate on table "public"."mcc_spending_category" to "anon";

grant update on table "public"."mcc_spending_category" to "anon";

grant delete on table "public"."mcc_spending_category" to "authenticated";

grant insert on table "public"."mcc_spending_category" to "authenticated";

grant references on table "public"."mcc_spending_category" to "authenticated";

grant select on table "public"."mcc_spending_category" to "authenticated";

grant trigger on table "public"."mcc_spending_category" to "authenticated";

grant truncate on table "public"."mcc_spending_category" to "authenticated";

grant update on table "public"."mcc_spending_category" to "authenticated";

grant delete on table "public"."mcc_spending_category" to "service_role";

grant insert on table "public"."mcc_spending_category" to "service_role";

grant references on table "public"."mcc_spending_category" to "service_role";

grant select on table "public"."mcc_spending_category" to "service_role";

grant trigger on table "public"."mcc_spending_category" to "service_role";

grant truncate on table "public"."mcc_spending_category" to "service_role";

grant update on table "public"."mcc_spending_category" to "service_role";

grant delete on table "public"."reward_amex_category" to "anon";

grant insert on table "public"."reward_amex_category" to "anon";

grant references on table "public"."reward_amex_category" to "anon";

grant select on table "public"."reward_amex_category" to "anon";

grant trigger on table "public"."reward_amex_category" to "anon";

grant truncate on table "public"."reward_amex_category" to "anon";

grant update on table "public"."reward_amex_category" to "anon";

grant delete on table "public"."reward_amex_category" to "authenticated";

grant insert on table "public"."reward_amex_category" to "authenticated";

grant references on table "public"."reward_amex_category" to "authenticated";

grant select on table "public"."reward_amex_category" to "authenticated";

grant trigger on table "public"."reward_amex_category" to "authenticated";

grant truncate on table "public"."reward_amex_category" to "authenticated";

grant update on table "public"."reward_amex_category" to "authenticated";

grant delete on table "public"."reward_amex_category" to "service_role";

grant insert on table "public"."reward_amex_category" to "service_role";

grant references on table "public"."reward_amex_category" to "service_role";

grant select on table "public"."reward_amex_category" to "service_role";

grant trigger on table "public"."reward_amex_category" to "service_role";

grant truncate on table "public"."reward_amex_category" to "service_role";

grant update on table "public"."reward_amex_category" to "service_role";

grant delete on table "public"."reward_merchant" to "anon";

grant insert on table "public"."reward_merchant" to "anon";

grant references on table "public"."reward_merchant" to "anon";

grant select on table "public"."reward_merchant" to "anon";

grant trigger on table "public"."reward_merchant" to "anon";

grant truncate on table "public"."reward_merchant" to "anon";

grant update on table "public"."reward_merchant" to "anon";

grant delete on table "public"."reward_merchant" to "authenticated";

grant insert on table "public"."reward_merchant" to "authenticated";

grant references on table "public"."reward_merchant" to "authenticated";

grant select on table "public"."reward_merchant" to "authenticated";

grant trigger on table "public"."reward_merchant" to "authenticated";

grant truncate on table "public"."reward_merchant" to "authenticated";

grant update on table "public"."reward_merchant" to "authenticated";

grant delete on table "public"."reward_merchant" to "service_role";

grant insert on table "public"."reward_merchant" to "service_role";

grant references on table "public"."reward_merchant" to "service_role";

grant select on table "public"."reward_merchant" to "service_role";

grant trigger on table "public"."reward_merchant" to "service_role";

grant truncate on table "public"."reward_merchant" to "service_role";

grant update on table "public"."reward_merchant" to "service_role";

grant delete on table "public"."reward_spending_category" to "anon";

grant insert on table "public"."reward_spending_category" to "anon";

grant references on table "public"."reward_spending_category" to "anon";

grant select on table "public"."reward_spending_category" to "anon";

grant trigger on table "public"."reward_spending_category" to "anon";

grant truncate on table "public"."reward_spending_category" to "anon";

grant update on table "public"."reward_spending_category" to "anon";

grant delete on table "public"."reward_spending_category" to "authenticated";

grant insert on table "public"."reward_spending_category" to "authenticated";

grant references on table "public"."reward_spending_category" to "authenticated";

grant select on table "public"."reward_spending_category" to "authenticated";

grant trigger on table "public"."reward_spending_category" to "authenticated";

grant truncate on table "public"."reward_spending_category" to "authenticated";

grant update on table "public"."reward_spending_category" to "authenticated";

grant delete on table "public"."reward_spending_category" to "service_role";

grant insert on table "public"."reward_spending_category" to "service_role";

grant references on table "public"."reward_spending_category" to "service_role";

grant select on table "public"."reward_spending_category" to "service_role";

grant trigger on table "public"."reward_spending_category" to "service_role";

grant truncate on table "public"."reward_spending_category" to "service_role";

grant update on table "public"."reward_spending_category" to "service_role";

grant delete on table "public"."transaction" to "anon";

grant insert on table "public"."transaction" to "anon";

grant references on table "public"."transaction" to "anon";

grant select on table "public"."transaction" to "anon";

grant trigger on table "public"."transaction" to "anon";

grant truncate on table "public"."transaction" to "anon";

grant update on table "public"."transaction" to "anon";

grant delete on table "public"."transaction" to "authenticated";

grant insert on table "public"."transaction" to "authenticated";

grant references on table "public"."transaction" to "authenticated";

grant select on table "public"."transaction" to "authenticated";

grant trigger on table "public"."transaction" to "authenticated";

grant truncate on table "public"."transaction" to "authenticated";

grant update on table "public"."transaction" to "authenticated";

grant delete on table "public"."transaction" to "service_role";

grant insert on table "public"."transaction" to "service_role";

grant references on table "public"."transaction" to "service_role";

grant select on table "public"."transaction" to "service_role";

grant trigger on table "public"."transaction" to "service_role";

grant truncate on table "public"."transaction" to "service_role";

grant update on table "public"."transaction" to "service_role";

grant delete on table "public"."transaction_benefit" to "anon";

grant insert on table "public"."transaction_benefit" to "anon";

grant references on table "public"."transaction_benefit" to "anon";

grant select on table "public"."transaction_benefit" to "anon";

grant trigger on table "public"."transaction_benefit" to "anon";

grant truncate on table "public"."transaction_benefit" to "anon";

grant update on table "public"."transaction_benefit" to "anon";

grant delete on table "public"."transaction_benefit" to "authenticated";

grant insert on table "public"."transaction_benefit" to "authenticated";

grant references on table "public"."transaction_benefit" to "authenticated";

grant select on table "public"."transaction_benefit" to "authenticated";

grant trigger on table "public"."transaction_benefit" to "authenticated";

grant truncate on table "public"."transaction_benefit" to "authenticated";

grant update on table "public"."transaction_benefit" to "authenticated";

grant delete on table "public"."transaction_benefit" to "service_role";

grant insert on table "public"."transaction_benefit" to "service_role";

grant references on table "public"."transaction_benefit" to "service_role";

grant select on table "public"."transaction_benefit" to "service_role";

grant trigger on table "public"."transaction_benefit" to "service_role";

grant truncate on table "public"."transaction_benefit" to "service_role";

grant update on table "public"."transaction_benefit" to "service_role";

grant delete on table "public"."user_benefit" to "anon";

grant insert on table "public"."user_benefit" to "anon";

grant references on table "public"."user_benefit" to "anon";

grant select on table "public"."user_benefit" to "anon";

grant trigger on table "public"."user_benefit" to "anon";

grant truncate on table "public"."user_benefit" to "anon";

grant update on table "public"."user_benefit" to "anon";

grant delete on table "public"."user_benefit" to "authenticated";

grant insert on table "public"."user_benefit" to "authenticated";

grant references on table "public"."user_benefit" to "authenticated";

grant select on table "public"."user_benefit" to "authenticated";

grant trigger on table "public"."user_benefit" to "authenticated";

grant truncate on table "public"."user_benefit" to "authenticated";

grant update on table "public"."user_benefit" to "authenticated";

grant delete on table "public"."user_benefit" to "service_role";

grant insert on table "public"."user_benefit" to "service_role";

grant references on table "public"."user_benefit" to "service_role";

grant select on table "public"."user_benefit" to "service_role";

grant trigger on table "public"."user_benefit" to "service_role";

grant truncate on table "public"."user_benefit" to "service_role";

grant update on table "public"."user_benefit" to "service_role";

grant delete on table "public"."user_benefit_entry" to "anon";

grant insert on table "public"."user_benefit_entry" to "anon";

grant references on table "public"."user_benefit_entry" to "anon";

grant select on table "public"."user_benefit_entry" to "anon";

grant trigger on table "public"."user_benefit_entry" to "anon";

grant truncate on table "public"."user_benefit_entry" to "anon";

grant update on table "public"."user_benefit_entry" to "anon";

grant delete on table "public"."user_benefit_entry" to "authenticated";

grant insert on table "public"."user_benefit_entry" to "authenticated";

grant references on table "public"."user_benefit_entry" to "authenticated";

grant select on table "public"."user_benefit_entry" to "authenticated";

grant trigger on table "public"."user_benefit_entry" to "authenticated";

grant truncate on table "public"."user_benefit_entry" to "authenticated";

grant update on table "public"."user_benefit_entry" to "authenticated";

grant delete on table "public"."user_benefit_entry" to "service_role";

grant insert on table "public"."user_benefit_entry" to "service_role";

grant references on table "public"."user_benefit_entry" to "service_role";

grant select on table "public"."user_benefit_entry" to "service_role";

grant trigger on table "public"."user_benefit_entry" to "service_role";

grant truncate on table "public"."user_benefit_entry" to "service_role";

grant update on table "public"."user_benefit_entry" to "service_role";

grant delete on table "public"."user_promotion" to "anon";

grant insert on table "public"."user_promotion" to "anon";

grant references on table "public"."user_promotion" to "anon";

grant select on table "public"."user_promotion" to "anon";

grant trigger on table "public"."user_promotion" to "anon";

grant truncate on table "public"."user_promotion" to "anon";

grant update on table "public"."user_promotion" to "anon";

grant delete on table "public"."user_promotion" to "authenticated";

grant insert on table "public"."user_promotion" to "authenticated";

grant references on table "public"."user_promotion" to "authenticated";

grant select on table "public"."user_promotion" to "authenticated";

grant trigger on table "public"."user_promotion" to "authenticated";

grant truncate on table "public"."user_promotion" to "authenticated";

grant update on table "public"."user_promotion" to "authenticated";

grant delete on table "public"."user_promotion" to "service_role";

grant insert on table "public"."user_promotion" to "service_role";

grant references on table "public"."user_promotion" to "service_role";

grant select on table "public"."user_promotion" to "service_role";

grant trigger on table "public"."user_promotion" to "service_role";

grant truncate on table "public"."user_promotion" to "service_role";

grant update on table "public"."user_promotion" to "service_role";

CREATE TRIGGER set_updated_at_credit_card BEFORE UPDATE ON public.credit_card FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_note BEFORE UPDATE ON public.note FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_user_benefit BEFORE UPDATE ON public.user_benefit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_user_promotion BEFORE UPDATE ON public.user_promotion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


