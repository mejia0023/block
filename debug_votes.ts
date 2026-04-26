import { Client } from 'pg';

async function simulate() {
    const pgClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'muerte',
        database: 'evoting_db',
    });

    try {
        await pgClient.connect();
        console.log('Depurando simulación de votos...');

        const electionsRes = await pgClient.query("SELECT id FROM elecciones WHERE estado = 'ACTIVA' LIMIT 1");
        const usersRes = await pgClient.query("SELECT id, identificador FROM usuarios WHERE rol = 'VOTANTE' LIMIT 70");
        
        const electionId = electionsRes.rows[0].id;
        const users = usersRes.rows;

        const candRes = await pgClient.query("SELECT id FROM candidatos WHERE id_eleccion = $1", [electionId]);
        const candidateId = candRes.rows[0].id;

        const user = users[0];
        console.log(`Probando voto con usuario: ${user.identificador}`);

        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: user.identificador, password: 'password123' })
        });

        const loginData: any = await loginRes.json();
        if (!loginData.access_token) {
             console.error('Error en login:', loginData);
             return;
        }

        const voteRes = await fetch('http://localhost:3000/voting/cast', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.access_token}`
            },
            body: JSON.stringify({ electionId, candidateId })
        });

        const voteData = await voteRes.json();
        console.log('Resultado del voto:', voteData);

    } catch (err) {
        console.error('Error crítico:', err);
    } finally {
        await pgClient.end();
    }
}

simulate();
