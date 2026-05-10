-- Native OTP refactor: remove the custom OTP plumbing that backed the
-- old send-otp / verify-otp edge functions, and let Supabase Auth own the
-- email/SMS code flow end-to-end.
--
-- After this migration:
--   • signInWithOtp({ email })  → Supabase sends 6-digit code via Custom SMTP (Resend)
--   • signInWithOtp({ phone })  → Supabase sends 6-digit code via Twilio Verify
--   • verifyOtp({ ..., type })  → Supabase issues the session
--   • New auth.users INSERT     → handle_new_user trigger seeds public.profiles
--                                 from raw_user_meta_data (firstName/lastName/role)
--   • auth.users.phone change   → mirror_auth_phone_to_profile copies the
--                                 confirmed phone into public.profiles.phone

-- Drop the custom OTP storage. otp_codes held the 6-digit code + expiry,
-- otp_rate_limits enforced "5 attempts per identifier per hour" — both jobs
-- are now handled by Supabase Auth's native rate limits.
DROP TABLE IF EXISTS public.otp_codes CASCADE;
DROP TABLE IF EXISTS public.otp_rate_limits CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otp_codes() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_otp_rate_limits() CASCADE;

-- Seeds public.profiles whenever Supabase Auth creates a new user.
-- Frontend signup passes first_name / last_name / role / phone via the `data`
-- option on signInWithOtp, which Supabase stores as raw_user_meta_data.
-- COALESCE to '' so a user accidentally created without metadata still
-- satisfies the NOT NULL constraints (recoverable via profile-edit UI later).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'athlete'::user_role),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Mirror a confirmed phone change on auth.users into public.profiles.phone.
-- The existing profiles_enforce_unique_phone trigger will reject duplicates,
-- so the auth update succeeds but the profile mirror raises — frontend
-- catches that and surfaces a "phone already in use" error to the user.
CREATE OR REPLACE FUNCTION public.mirror_auth_phone_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.phone_confirmed_at IS NOT NULL
     AND (OLD.phone_confirmed_at IS DISTINCT FROM NEW.phone_confirmed_at
          OR OLD.phone IS DISTINCT FROM NEW.phone) THEN
    UPDATE public.profiles
    SET phone = NEW.phone
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_phone_confirmed ON auth.users;
CREATE TRIGGER on_auth_phone_confirmed
  AFTER UPDATE OF phone, phone_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.mirror_auth_phone_to_profile();
