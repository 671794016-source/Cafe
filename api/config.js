// ==========================================================================
// Vercel Serverless Function - Serve Environment Variables to Client Browser
// This file runs on Vercel backend at runtime when /api/config is fetched.
// ==========================================================================

export default function handler(req, res) {
  // Set CORS headers so it runs smoothly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Return Supabase credentials from Vercel dashboard environment variables
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseKey: process.env.SUPABASE_ANON_KEY || null
  });
}
