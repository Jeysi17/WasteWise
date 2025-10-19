import { client } from "@/config/NilePostgresConfig";

export async function GET(request: Request) {
    try {
        console.log('📍 Location API endpoint called');
        
        // Get userEmail from query parameters
        const url = new URL(request.url);
        const userEmail = url.searchParams.get('userEmail');
        
        console.log('📧 User email:', userEmail);
        
        // Validate email
        if (!userEmail) {
            console.log('❌ No userEmail provided');
            return Response.json(
                { error: 'userEmail is required' },
                { status: 400 }
            );
        }

        // Connect to database
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Database connected');

        // Use parameterized query to prevent SQL injection
        const query = `
            SELECT location FROM users WHERE email = $1;
        `;
        
        console.log('🔍 Executing query for email:', userEmail);
        const result = await client.query(query, [userEmail]);
        console.log('📊 Query result:', result.rows);

        if (result.rows.length === 0) {
            console.log('❌ User not found');
            return Response.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const location = result.rows[0].location;
        console.log('📍 Found location:', location);

        return Response.json({ location });
    } catch (err) {
        console.error('❌ Error fetching location:', err);
        return Response.json(
            { error: 'Failed to fetch location', details: err },
            { status: 500 }
        );
    } finally {
        try {
            await client.end();
            console.log('🔌 Database connection closed');
        } catch (endErr) {
            console.error('❌ Error closing connection:', endErr);
        }
    }
}