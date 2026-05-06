create type "public"."redemption_type_type" as enum ('travel_portal', 'cash_back_conversion', 'transfer_partner', 'gift_card', 'other');

alter type "public"."reset_frequency_type" rename to "reset_frequency_type__old_version_to_be_dropped";

create type "public"."reset_frequency_type" as enum ('monthly', 'annual', 'one_time', 'semi_annual');


  create table "public"."merchant" (
    "merchant_id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "keyword" text not null,
    "mcc_id" uuid default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."merchant" enable row level security;


  create table "public"."reward_exclusion" (
    "reward_exclusion_id" uuid not null default gen_random_uuid(),
    "reward_id" uuid not null default gen_random_uuid(),
    "merchant_keyword" text not null,
    "reason" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reward_exclusion" enable row level security;


  create table "public"."reward_redemption" (
    "redemption_id" uuid not null default gen_random_uuid(),
    "credit_card_id" uuid not null,
    "redemption_date" date not null,
    "amount_redeemed" numeric not null,
    "redemption_type" public.redemption_type_type not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reward_redemption" enable row level security;

alter table "public"."benefit" alter column reset_frequency type "public"."reset_frequency_type" using reset_frequency::text::"public"."reset_frequency_type";

alter table "public"."transaction" alter column rewards_currency type "public"."reward_currency_type" using rewards_currency::text::"public"."reward_currency_type";

drop type "public"."reset_frequency_type__old_version_to_be_dropped";

alter table "public"."credit_card" alter column "statement_close_day" set not null;

alter table "public"."reward" alter column "cap_period" set data type public.cap_period_type using null::public.cap_period_type;

alter table "public"."transaction" add column "booked_through_issuer_portal" boolean not null default false;

alter table "public"."transaction" alter column "rewards_currency" drop not null;

alter table "public"."transaction" alter column "rewards_earned" drop default;

alter table "public"."transaction" alter column "rewards_earned" drop not null;

alter table "public"."user_benefit" add column "cycle_end_date" date not null;

alter table "public"."user_benefit_entry" add column "transaction_id" uuid;

CREATE UNIQUE INDEX merchant_pkey ON public.merchant USING btree (merchant_id);

CREATE UNIQUE INDEX reward_exclusion_pkey ON public.reward_exclusion USING btree (reward_exclusion_id);

CREATE UNIQUE INDEX reward_redemption_pkey ON public.reward_redemption USING btree (redemption_id);

alter table "public"."merchant" add constraint "merchant_pkey" PRIMARY KEY using index "merchant_pkey";

alter table "public"."reward_exclusion" add constraint "reward_exclusion_pkey" PRIMARY KEY using index "reward_exclusion_pkey";

alter table "public"."reward_redemption" add constraint "reward_redemption_pkey" PRIMARY KEY using index "reward_redemption_pkey";

alter table "public"."merchant" add constraint "merchant_mcc_id_fkey" FOREIGN KEY (mcc_id) REFERENCES public.mcc(mcc_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."merchant" validate constraint "merchant_mcc_id_fkey";

alter table "public"."reward_exclusion" add constraint "reward_exclusion_reward_id_fkey" FOREIGN KEY (reward_id) REFERENCES public.reward(reward_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."reward_exclusion" validate constraint "reward_exclusion_reward_id_fkey";

alter table "public"."reward_redemption" add constraint "reward_redemption_amount_redeemed_check" CHECK ((amount_redeemed > (0)::numeric)) not valid;

alter table "public"."reward_redemption" validate constraint "reward_redemption_amount_redeemed_check";

alter table "public"."reward_redemption" add constraint "reward_redemption_credit_card_id_fkey" FOREIGN KEY (credit_card_id) REFERENCES public.credit_card(credit_card_id) ON DELETE CASCADE not valid;

alter table "public"."reward_redemption" validate constraint "reward_redemption_credit_card_id_fkey";

alter table "public"."user_benefit_entry" add constraint "user_benefit_entry_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE CASCADE not valid;

alter table "public"."user_benefit_entry" validate constraint "user_benefit_entry_transaction_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.reverse_benefit_usage_on_transaction_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  tb RECORD;
  ub_id UUID;
  ub_amount_used NUMERIC;
BEGIN
  FOR tb IN
    SELECT benefit_id, amount_applied
    FROM transaction_benefit
    WHERE transaction_id = OLD.transaction_id
  LOOP
    SELECT user_benefit_id, amount_used
    INTO ub_id, ub_amount_used
    FROM user_benefit
    WHERE credit_card_id = OLD.credit_card_id
      AND benefit_id = tb.benefit_id
    ORDER BY cycle_start_date DESC
    LIMIT 1;

    IF ub_id IS NOT NULL THEN
      UPDATE user_benefit
      SET amount_used = GREATEST(0, ub_amount_used - tb.amount_applied)
      WHERE user_benefit_id = ub_id;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$function$
;

grant delete on table "public"."merchant" to "anon";

grant insert on table "public"."merchant" to "anon";

grant references on table "public"."merchant" to "anon";

grant select on table "public"."merchant" to "anon";

grant trigger on table "public"."merchant" to "anon";

grant truncate on table "public"."merchant" to "anon";

grant update on table "public"."merchant" to "anon";

grant delete on table "public"."merchant" to "authenticated";

grant insert on table "public"."merchant" to "authenticated";

grant references on table "public"."merchant" to "authenticated";

grant select on table "public"."merchant" to "authenticated";

grant trigger on table "public"."merchant" to "authenticated";

grant truncate on table "public"."merchant" to "authenticated";

grant update on table "public"."merchant" to "authenticated";

grant delete on table "public"."merchant" to "service_role";

grant insert on table "public"."merchant" to "service_role";

grant references on table "public"."merchant" to "service_role";

grant select on table "public"."merchant" to "service_role";

grant trigger on table "public"."merchant" to "service_role";

grant truncate on table "public"."merchant" to "service_role";

grant update on table "public"."merchant" to "service_role";

grant delete on table "public"."reward_exclusion" to "anon";

grant insert on table "public"."reward_exclusion" to "anon";

grant references on table "public"."reward_exclusion" to "anon";

grant select on table "public"."reward_exclusion" to "anon";

grant trigger on table "public"."reward_exclusion" to "anon";

grant truncate on table "public"."reward_exclusion" to "anon";

grant update on table "public"."reward_exclusion" to "anon";

grant delete on table "public"."reward_exclusion" to "authenticated";

grant insert on table "public"."reward_exclusion" to "authenticated";

grant references on table "public"."reward_exclusion" to "authenticated";

grant select on table "public"."reward_exclusion" to "authenticated";

grant trigger on table "public"."reward_exclusion" to "authenticated";

grant truncate on table "public"."reward_exclusion" to "authenticated";

grant update on table "public"."reward_exclusion" to "authenticated";

grant delete on table "public"."reward_exclusion" to "service_role";

grant insert on table "public"."reward_exclusion" to "service_role";

grant references on table "public"."reward_exclusion" to "service_role";

grant select on table "public"."reward_exclusion" to "service_role";

grant trigger on table "public"."reward_exclusion" to "service_role";

grant truncate on table "public"."reward_exclusion" to "service_role";

grant update on table "public"."reward_exclusion" to "service_role";

grant delete on table "public"."reward_redemption" to "anon";

grant insert on table "public"."reward_redemption" to "anon";

grant references on table "public"."reward_redemption" to "anon";

grant select on table "public"."reward_redemption" to "anon";

grant trigger on table "public"."reward_redemption" to "anon";

grant truncate on table "public"."reward_redemption" to "anon";

grant update on table "public"."reward_redemption" to "anon";

grant delete on table "public"."reward_redemption" to "authenticated";

grant insert on table "public"."reward_redemption" to "authenticated";

grant references on table "public"."reward_redemption" to "authenticated";

grant select on table "public"."reward_redemption" to "authenticated";

grant trigger on table "public"."reward_redemption" to "authenticated";

grant truncate on table "public"."reward_redemption" to "authenticated";

grant update on table "public"."reward_redemption" to "authenticated";

grant delete on table "public"."reward_redemption" to "service_role";

grant insert on table "public"."reward_redemption" to "service_role";

grant references on table "public"."reward_redemption" to "service_role";

grant select on table "public"."reward_redemption" to "service_role";

grant trigger on table "public"."reward_redemption" to "service_role";

grant truncate on table "public"."reward_redemption" to "service_role";

grant update on table "public"."reward_redemption" to "service_role";

CREATE TRIGGER trg_reverse_benefit_usage BEFORE DELETE ON public.transaction FOR EACH ROW EXECUTE FUNCTION public.reverse_benefit_usage_on_transaction_delete();


