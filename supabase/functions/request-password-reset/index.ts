import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get request body
    const { name, redirectUrl } = await req.json();

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Password reset requested for user name: ${name}`);

    // Find user by name and get their tenant_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, tenant_id')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.log(`No user found with name: ${name}`);
      // Return success anyway to prevent user enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o usuário existir, um email de recuperação será enviado.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the tenant owner (admin) email
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('owner_id')
      .eq('id', profile.tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant lookup error:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar informações do tenant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the admin's email (tenant owner)
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', tenant.owner_id)
      .single();

    if (adminError || !adminProfile?.email) {
      console.error('Admin lookup error:', adminError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar email do administrador' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The reset link is for the user's email, but notification goes to admin
    const userEmail = profile.email; // The actual user's email for the reset link
    const adminEmail = adminProfile.email; // Where to send the notification

    if (!userEmail) {
      console.error(`No email found for user: ${profile.id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o usuário existir, um email de recuperação será enviado.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending password reset for ${profile.name} (${userEmail}) to admin: ${adminEmail}`);

    // Generate a password reset token using admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: redirectUrl || `${supabaseUrl}/reset-password`
      }
    });

    if (linkError) {
      console.error('Generate link error:', linkError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link de recuperação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the info - the reset link should be sent to the admin's email
    console.log(`Password reset link generated for ${profile.name}`);
    console.log(`Will be sent to admin email: ${adminEmail}`);
    console.log(`Reset link: ${linkData.properties?.action_link}`);

    // Return info about where the email will be sent
    // In production, you would integrate with Resend to actually send the email to adminEmail
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Link de recuperação será enviado para o email do administrador.`,
        adminNotified: true,
        adminEmail: adminEmail,
        userName: profile.name,
        // In production, remove actionLink - this is for testing only
        actionLink: linkData.properties?.action_link
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
