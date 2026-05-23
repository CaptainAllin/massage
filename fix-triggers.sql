-- Fix the trigger function to handle role casting properly
-- Drop existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public."UserRole";
BEGIN
  -- Safely extract and cast the role
  BEGIN
    user_role := COALESCE(
      CAST(NEW.raw_user_meta_data->>'role' AS public."UserRole"),
      'CLIENT'::public."UserRole"
    );
  EXCEPTION WHEN OTHERS THEN
    user_role := 'CLIENT'::public."UserRole";
  END;

  -- Insert into public.users
  INSERT INTO public.users (
    "authUserId",
    email,
    "firstName",
    "lastName",
    role,
    "phoneNumber",
    "profileImageUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    user_role,
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth user creation
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify it was created
SELECT 'Trigger recreated successfully!' AS status;
