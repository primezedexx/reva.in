// ============================================================================
// REVA (reva.in) — API Route: List All Active Businesses (/api/businesses)
// Powers Explore & Discovery for Customers
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveCoordinates(b: any): { lat: number; lng: number } {
  if (b.latitude && b.longitude && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))) {
    return { lat: Number(b.latitude), lng: Number(b.longitude) };
  }
  const text = `${b.name || ''} ${b.address || ''} ${b.area || ''} ${b.city || ''} ${b.slug || ''}`.toLowerCase();
  if (text.includes('gokhiware') || text.includes('vasai east')) return { lat: 19.3919, lng: 72.8397 };
  if (text.includes('vasai')) return { lat: 19.3837, lng: 72.8282 };
  if (text.includes('virar')) return { lat: 19.4674, lng: 72.8041 };
  if (text.includes('nalasopara')) return { lat: 19.4182, lng: 72.8184 };
  if (text.includes('andheri')) return { lat: 19.1136, lng: 72.8697 };
  if (text.includes('bandra')) return { lat: 19.0596, lng: 72.8295 };
  if (text.includes('bkc') || text.includes('kurla')) return { lat: 19.0664, lng: 72.8679 };
  if (text.includes('juhu') || text.includes('vile parle')) return { lat: 19.1025, lng: 72.8273 };
  if (text.includes('powai') || text.includes('hiranandani')) return { lat: 19.1197, lng: 72.9051 };
  if (text.includes('colaba') || text.includes('fort') || text.includes('nariman') || text.includes('marine')) return { lat: 18.9067, lng: 72.8147 };
  if (text.includes('mumbai') || text.includes('bombay')) return { lat: 19.0760, lng: 72.8777 };
  if (text.includes('indiranagar')) return { lat: 12.9784, lng: 77.6408 };
  if (text.includes('koramangala')) return { lat: 12.9352, lng: 77.6245 };
  if (text.includes('lavelle') || text.includes('ashok nagar')) return { lat: 12.9716, lng: 77.5946 };
  if (text.includes('hsr')) return { lat: 12.9121, lng: 77.6446 };
  if (text.includes('whitefield')) return { lat: 12.9698, lng: 77.7500 };
  if (text.includes('bengaluru') || text.includes('bangalore')) return { lat: 12.9716, lng: 77.5946 };
  if (text.includes('pune') || text.includes('koregaon')) return { lat: 18.5362, lng: 73.8940 };
  if (text.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };
  return { lat: 12.9716, lng: 77.5946 };
}

export async function GET(req: NextRequest) {
  try {
    const businesses = await db.getBusinesses(true);

    return NextResponse.json(
      {
        success: true,
        businesses: businesses.map((b) => {
          const coords = resolveCoordinates(b);
          return {
            id: b.id,
            name: b.name,
            slug: b.slug,
            logo_url: b.logo_url,
            brand_color: b.brand_color || '#0F172A',
            reward_rule: b.reward_rule,
            active_offers: b.active_offers || [],
            avg_spend_per_visit: b.avg_spend_per_visit || 250,
            category: b.category || b.reward_rule?.category || 'Café & Beverage',
            city: b.city || b.reward_rule?.city || 'Bengaluru',
            area: b.area || b.reward_rule?.area || 'Indiranagar',
            address: b.address || b.reward_rule?.address || '',
            latitude: coords.lat,
            longitude: coords.lng,
            google_review_url: b.google_review_url || b.reward_rule?.google_review_url,
            isOpen: true,
          };
        }),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching businesses' },
      { status: 500 }
    );
  }
}
