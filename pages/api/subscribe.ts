import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Invalid email' });

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email }]);

    if (error) {
      // Gracefully handle duplicate email (unique violation)
      if ((error as any).code === '23505') {
        return res.status(200).json({ success: true, duplicate: true });
      }
      console.error('Supabase insert error', error);
      const isProd = process.env.NODE_ENV === 'production';
      return res.status(500).json({
        error: 'Database error',
        code: (error as any).code,
        message: isProd ? undefined : (error as any).message,
        details: isProd ? undefined : (error as any).details,
        hint: isProd ? undefined : (error as any).hint,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
      error: 'Server error',
      message: isProd ? undefined : (err as any)?.message,
    });
  }
}
