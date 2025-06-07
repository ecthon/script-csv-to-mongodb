import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

async function runExampleQueries(): Promise<void> {
    const client = new MongoClient(process.env.MONGO_CONNECTION_STRING!);
    
    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DATABASE || 'movies_db');
        const movies = db.collection('movies');
        
        console.log('🔍 EXEMPLOS DE CONSULTAS');
        console.log('═'.repeat(50));
        
        // 1. Total de filmes
        const total = await movies.countDocuments();
        console.log(`📊 Total de filmes: ${total.toLocaleString()}`);
        
        // 2. Top 5 filmes mais populares
        console.log('\n🔥 Top 5 filmes mais populares:');
        const topPopular = await movies
            .find({})
            .sort({ popularity: -1 })
            .limit(5)
            .toArray();
        
        topPopular.forEach((movie, index) => {
            console.log(`   ${index + 1}. ${movie.title} (${movie.popularity.toFixed(1)})`);
        });
        
        // 3. Filmes com maior receita
        console.log('\n💰 Top 5 filmes com maior receita:');
        const topRevenue = await movies
            .find({ revenue: { $gt: 0 } })
            .sort({ revenue: -1 })
            .limit(5)
            .toArray();
        
        topRevenue.forEach((movie, index) => {
            const revenueM = (movie.revenue / 1_000_000).toFixed(1);
            console.log(`   ${index + 1}. ${movie.title} - $${revenueM}M`);
        });
        
        // 4. Gêneros mais comuns
        console.log('\n🎭 Top 5 gêneros mais comuns:');
        const genreStats = await movies.aggregate([
            { $unwind: '$genres' },
            { $group: { _id: '$genres.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();
        
        genreStats.forEach((genre, index) => {
            console.log(`   ${index + 1}. ${genre._id}: ${genre.count} filmes`);
        });
        
        // 5. Filmes por década
        console.log('\n📅 Filmes por década:');
        const decadeStats = await movies.aggregate([
            { $match: { release_date: { $ne: null } } },
            { $addFields: { year: { $year: '$release_date' } } },
            { $addFields: { decade: { $multiply: [{ $floor: { $divide: ['$year', 10] } }, 10] } } },
            { $group: { _id: '$decade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).toArray();
        
        decadeStats.forEach(decade => {
            console.log(`   ${decade._id}s: ${decade.count} filmes`);
        });
        
        console.log('\n✅ Consultas executadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao executar consultas:', error);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    runExampleQueries();
}