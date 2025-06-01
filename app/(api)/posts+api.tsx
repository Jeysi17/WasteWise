import { client } from "@/config/NilePostgresConfig";

export async function GET(request: Request) {
    try {
        console.log('Attempting to connect to the database...');
        await client.connect();
        console.log('Database connection established');

        // Get and validate orderField
        const orderField = new URL(request.url).searchParams.get('orderField');
        const query = `
            SELECT * FROM approved_posts
            INNER JOIN users ON approved_posts.name = users.name
            ORDER BY ${orderField}
        `;

        console.log('Executing query:', query);
        const result = await client.query(query);
        console.log(`Query executed, ${result.rowCount} rows returned`);

        return Response.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching posts:', err);
        return Response.json(
            { error: 'Failed to fetch posts' },
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