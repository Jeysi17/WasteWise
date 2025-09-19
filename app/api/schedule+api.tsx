import { client } from "@/config/NilePostgresConfig";

export async function GET(request: Request) {
    try {
        console.log('Attempting to connect to the database...');
        await client.connect();
        console.log('Database connection established');

        // Get and validate orderField
        const orderField = new URL(request.url).searchParams.get('orderField');
        const query = `
           SELECT * FROM schedules;
        `;

        const result = await client.query(query);

        return Response.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching schedules:', err);
        return Response.json(
            { error: 'Failed to fetch schedules' },
            { status: 500 }
        );
    } finally {
        try {
            await client.end();
            console.log('Database connection closed');
        } catch (endErr) {
            console.error('Error closing connection:', endErr);
        }
    }
}