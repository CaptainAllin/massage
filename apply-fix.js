require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const queries = [
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
      `DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;`,
      `DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;`,
      `DROP FUNCTION IF EXISTS public.handle_new_user();`,
      `DROP FUNCTION IF EXISTS public.handle_user_update();`,
      `DROP FUNCTION IF EXISTS public.handle_user_delete();`,
      
      `CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.users (
          id,
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
          gen_random_uuid()::text,
          NEW.id::text,
          NEW.email::text,
          NEW.raw_user_meta_data->>'first_name',
          NEW.raw_user_meta_data->>'last_name',
          COALESCE((NEW.raw_user_meta_data->>'role')::public."UserRole", 'CLIENT'),
          NEW.phone::text,
          NEW.raw_user_meta_data->>'avatar_url',
          NOW(),
          NOW()
        );
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- We catch the exception and DO NOT raise it so auth is not broken!
          RAISE NOTICE 'Error in handle_new_user: %, %', SQLERRM, SQLSTATE;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`,

      `GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;`,
      `GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;`,
      `GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;`,

      `CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();`,

      `CREATE OR REPLACE FUNCTION public.handle_user_update()
      RETURNS TRIGGER
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        UPDATE public.users
        SET
          email = NEW.email::text,
          "phoneNumber" = NEW.phone::text,
          "firstName" = NEW.raw_user_meta_data->>'first_name',
          "lastName" = NEW.raw_user_meta_data->>'last_name',
          "profileImageUrl" = NEW.raw_user_meta_data->>'avatar_url',
          "updatedAt" = NOW()
        WHERE "authUserId" = NEW.id::text;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`,

      `GRANT EXECUTE ON FUNCTION public.handle_user_update() TO service_role;`,
      `GRANT EXECUTE ON FUNCTION public.handle_user_update() TO anon;`,
      `GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;`,

      `CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW
        WHEN (
          OLD.email IS DISTINCT FROM NEW.email OR
          OLD.phone IS DISTINCT FROM NEW.phone OR
          OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
        )
        EXECUTE FUNCTION public.handle_user_update();`,

      `CREATE OR REPLACE FUNCTION public.handle_user_delete()
      RETURNS TRIGGER
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        DELETE FROM public.users WHERE "authUserId" = OLD.id::text;
        RETURN OLD;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;`,

      `GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO service_role;`,
      `GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO anon;`,
      `GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO authenticated;`,

      `CREATE TRIGGER on_auth_user_deleted
        AFTER DELETE ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_user_delete();`
    ];

    for (const q of queries) {
      await prisma.$executeRawUnsafe(q);
    }
    console.log("Successfully applied fix to Supabase database!");
  } catch (e) {
    console.error("Failed to apply fix:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
