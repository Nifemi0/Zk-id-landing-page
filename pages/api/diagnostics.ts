import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = getSupabaseClient();
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([{ email: `diagnostic+${Date.now()}@example.com` }]);

    const smtp = { removed: true } as const;

    // Decode JWT (no verify) to extract project ref and compare with URL
    const decodeJwtRef = (token?: string) => {
      try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);
        return payload?.ref || null;
      } catch {
        return null;
      }
    };

    const refFromKey = decodeJwtRef(supabaseKey || undefined);
    let refFromUrl: string | null = null;
    try {
      if (supabaseUrl) {
        const host = new URL(supabaseUrl).host; // e.g. eajx...supabase.co
        refFromUrl = host.split('.')[0] || null;
      }
    } catch {
      refFromUrl = null;
    }

    // Direct REST check with provided key
    let restCheck: { status: number; ok: boolean; body?: any } | null = null;
    try {
      if (supabaseUrl && supabaseKey) {
        const r = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
        });
        let body: any = null;
        try { body = await r.json(); } catch { body = null; }
        restCheck = { status: r.status, ok: r.ok, body };
      }
    } catch (e) {
      restCheck = { status: 0, ok: false, body: { error: (e as any)?.message || 'fetch failed' } };
    }

    return res.status(200).json({
      ok: true,
      env: {
        supabaseUrl: Boolean(supabaseUrl),
        supabaseKey: Boolean(supabaseKey),
      },
      supabase: {
        insertError: insertError ? {
          code: (insertError as any).code,
          message: (insertError as any).message,
          details: (insertError as any).details,
        } : null,
        refFromKey,
        refFromUrl,
        refsMatch: Boolean(refFromKey && refFromUrl && refFromKey === refFromUrl),
        restCheck,
      },
      smtp,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: (err as any)?.message || 'unknown' });
  }
}


