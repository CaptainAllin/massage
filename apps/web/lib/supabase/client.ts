import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Client component usage (client-side)
export const supabase = createClientComponentClient();

// For server components, use createServerComponentClient
// For route handlers, use createRouteHandlerClient
