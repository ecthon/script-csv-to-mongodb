import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

async function testConnection(): Promise<void> {
    const connectionString = process.env.MONGO_CONNECTION_STRING;
    
    if (!connectionString) {
        console.error('❌ MONGO_CONNECTION_STRING não encontrada no .env');
        process.exit(1);
    }

    const client = new MongoClient(connectionString);

    try {
        console.log('🔗 Testando conexão com MongoDB Atlas...');
        await client.connect();
        
        // Testar ping
        await client.db('admin').admin().ping();
        console.log('✅ Conexão bem-sucedida!');
        
        // Testar criação de documento
        const db = client.db(process.env.MONGO_DATABASE || 'movies_db');
        const collection = db.collection('test');
        
        const testDoc = { 
            title: 'Teste de Conexão', 
            timestamp: new Date(),
            status: 'success'
        };
        
        const result = await collection.insertOne(testDoc);
        console.log('✅ Documento de teste inserido:', result.insertedId);
        
        // Buscar documento
        const found = await collection.findOne({ _id: result.insertedId });
        console.log('✅ Documento encontrado:', found?.title);
        
        // Limpar teste
        await collection.deleteOne({ _id: result.insertedId });
        console.log('Documento de teste removido');
        
        console.log('\n🎉 CONEXÃO FUNCIONANDO PERFEITAMENTE!');
        console.log('Agora você pode executar o importador principal.');
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        console.log('\n💡 Verifique:');
        console.log('1. Se a string de conexão está correta no .env');
        console.log('2. Se sua senha está correta');
        console.log('3. Se seu IP está liberado no MongoDB Atlas');
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    testConnection();
}