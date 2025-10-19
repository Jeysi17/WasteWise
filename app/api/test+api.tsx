export async function GET(request: Request) {
    try {
        console.log('🧪 Test API endpoint called');
        
        return Response.json({
            message: 'API is working!',
            timestamp: new Date().toISOString(),
            environment: {
                EXPO_PUBLIC_HOST_URL: process.env.EXPO_PUBLIC_HOST_URL,
                NODE_ENV: process.env.NODE_ENV
            }
        });
    } catch (err) {
        console.error('❌ Test API error:', err);
        return Response.json(
            { error: 'Test API failed', details: err },
            { status: 500 }
        );
    }
}
