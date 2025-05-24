import { client } from "@/config/NilePostgresConfig";

export async function POST(request: Request) {

    const { email, name, location } = await request.json();
    
    await client.connect();
    const result = await client.query(`
        INSERT INTO users VALUES (DEFAULT, '${name}', '${email}', '${location}')
        `)
    await client.end();
    return Response.json(result);
}