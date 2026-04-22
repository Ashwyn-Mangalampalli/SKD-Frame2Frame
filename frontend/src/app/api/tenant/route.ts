import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .update({
        company_name: body.company_name,
        logo_url: body.logo_url,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
