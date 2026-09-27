// Editor types for Supabase Edge Functions. The function runs on Deno;
// this file lets the app TypeScript checker understand that without
// pulling Deno into the Nuxt project.

declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {}

declare namespace Deno {
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void

  namespace env {
    function get(key: string): string | undefined
  }
}
