import { client } from "@/config/NilePostgresConfig";

export async function POST(request: Request){
    const {name, title, category, imageUrl, location, details, date} = await request.json();

    await client.connect();
    const result = await client.query(`
        INSERT INTO pendings (name, title, category, image, location, details, post_date)
        VALUES ('${name}', '${title}', '${category}', '${imageUrl}', '${location}', '${details}', '${date}')
    `)
    await client.end();
    return Response.json(result);
}


