import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    let tenantId = existingProfile?.tenant_id;

    // If profile exists but has no tenant, we need to create or find one
    if (!tenantId) {
      // Check if user is an owner of any tenant
      const { data: ownedTenant } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownedTenant) {
        tenantId = ownedTenant.id;
      } else {
        // Create a new tenant for this user
        const companyName = (user.user_metadata as any)?.company_name || "Minha Empresa";
        const slug = companyName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") + "-" + user.id.substring(0, 8);

        const { data: newTenant, error: tenantError } = await supabaseAdmin
          .from("tenants")
          .insert({
            name: companyName,
            slug: slug,
            owner_id: user.id,
          })
          .select("id")
          .single();

        if (tenantError) {
          console.error("Error creating tenant:", tenantError);
        } else {
          tenantId = newTenant.id;
        }
      }
    }

    // Ensure profiles row exists with tenant_id
    if (!existingProfile) {
      await supabaseAdmin.from("profiles").insert({
        id: user.id,
        name: (user.user_metadata as any)?.name ?? user.email ?? "Usuário",
        email: user.email,
        tenant_id: tenantId,
      });
    } else if (!existingProfile.tenant_id && tenantId) {
      // Update existing profile with tenant_id
      await supabaseAdmin
        .from("profiles")
        .update({ tenant_id: tenantId })
        .eq("id", user.id);
    }

    // Ensure user_roles row exists with tenant_id
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id, tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingRole) {
      // Check if this is the first user (owner) or an invited user
      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("owner_id")
        .eq("id", tenantId)
        .maybeSingle();

      // If user is the tenant owner, they should be admin
      const isOwner = tenant?.owner_id === user.id;
      const role = isOwner ? "admin" : "seller";

      await supabaseAdmin.from("user_roles").insert({
        user_id: user.id,
        role,
        tenant_id: tenantId,
      });
    } else if (!existingRole.tenant_id && tenantId) {
      // Update existing role with tenant_id
      await supabaseAdmin
        .from("user_roles")
        .update({ tenant_id: tenantId })
        .eq("user_id", user.id);
    }

    // Keep profile email/name synced (best-effort)
    await supabaseAdmin
      .from("profiles")
      .update({
        email: user.email,
        name: (user.user_metadata as any)?.name ?? undefined,
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({ ok: true, tenant_id: tenantId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ensure-user error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
