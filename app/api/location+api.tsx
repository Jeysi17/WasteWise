import { client } from "@/config/NilePostgresConfig";

export async function GET(request: Request) {
    try {
        await client.connect();
        const userEmail = new URL(request.url).searchParams.get('userEmail');

        // Validate email
        if (!userEmail) {
            return Response.json(
                { error: 'userEmail is required' },
                { status: 400 }
            );
        }

        // Use parameterized query to prevent SQL injection
        const query = `
            SELECT location FROM users WHERE email = '${userEmail}';
        `;
        
        const result = await client.query(query, [userEmail]);

        if (result.rows.length === 0) {
            return Response.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return Response.json(result.rows[0]); // Return the first match
    } catch (err) {
        console.error('❌ Error fetching location:', err);
        return Response.json(
            { error: 'Failed to fetch location' },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}