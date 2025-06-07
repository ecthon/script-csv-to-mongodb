import fs from 'fs';
import csv from 'csv-parser';
import { MongoClient, Db, Collection } from 'mongodb';
import { config } from 'dotenv';
import { RawMovieData, CleanMovieData, Genre, ProductionCompany, ProductionCountry, SpokenLanguage, Keyword } from '../types/Movie';

config();

interface DatabaseConfig {
    connectionString: string;
    databaseName: string;
    collectionName: string;
}

export class MoviesImporter {
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private collection: Collection<CleanMovieData> | null = null;
    private config: DatabaseConfig;

    constructor() {
        this.config = {
            connectionString: process.env.MONGO_CONNECTION_STRING || '',
            databaseName: process.env.MONGO_DATABASE || 'movies_db',
            collectionName: process.env.MONGO_COLLECTION || 'movies'
        };

        if (!this.config.connectionString) {
            throw new Error('MONGO_CONNECTION_STRING não encontrada no arquivo .env');
        }
    }

    async connectToMongoDB(): Promise<void> {
        try {
            console.log('🔗 Conectando ao MongoDB Atlas...');
            this.client = new MongoClient(this.config.connectionString);
            await this.client.connect();
            
            // Testar conexão
            await this.client.db('admin').admin().ping();
            console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
            
            this.db = this.client.db(this.config.databaseName);
            this.collection = this.db.collection<CleanMovieData>(this.config.collectionName);
            
        } catch (error) {
            console.error('❌ Erro ao conectar ao MongoDB:', error);
            throw error;
        }
    }

    private parseJsonField<T>(fieldValue: string): T[] {
        if (!fieldValue || fieldValue.trim() === '' || fieldValue === 'null') {
            return [];
        }

        try {
            // Limpar e corrigir formato JSON
            const cleaned = fieldValue.replace(/'/g, '"').replace(/None/g, 'null');
            return JSON.parse(cleaned);
        } catch (error) {
            try {
                // Fallback: tentar eval (cuidado em produção!)
                return eval(`(${fieldValue})`) || [];
            } catch (evalError) {
                console.warn(`⚠️  Erro ao processar JSON: ${fieldValue.substring(0, 50)}...`);
                return [];
            }
        }
    }

    private cleanMovieData(rawMovie: RawMovieData): CleanMovieData {
        const now = new Date();
        
        return {
            movie_id: parseInt(rawMovie.id) || 0,
            title: rawMovie.title || '',
            original_title: rawMovie.original_title || '',
            overview: rawMovie.overview || '',
            tagline: rawMovie.tagline || '',
            status: rawMovie.status || 'Unknown',
            release_date: rawMovie.release_date ? new Date(rawMovie.release_date) : null,
            runtime: parseInt(rawMovie.runtime) || 0,
            adult: rawMovie.adult === 'True' || rawMovie.adult === 'true',
            original_language: rawMovie.original_language || '',
            homepage: rawMovie.homepage || '',
            imdb_id: rawMovie.imdb_id || '',
            
            // Informações financeiras
            budget: parseInt(rawMovie.budget) || 0,
            revenue: parseInt(rawMovie.revenue) || 0,
            
            // Avaliações
            vote_average: parseFloat(rawMovie.vote_average) || 0,
            vote_count: parseInt(rawMovie.vote_count) || 0,
            popularity: parseFloat(rawMovie.popularity) || 0,
            
            // Imagens
            backdrop_path: rawMovie.backdrop_path || '',
            poster_path: rawMovie.poster_path || '',
            
            // Arrays de objetos
            genres: this.parseJsonField<Genre>(rawMovie.genres),
            production_companies: this.parseJsonField<ProductionCompany>(rawMovie.production_companies),
            production_countries: this.parseJsonField<ProductionCountry>(rawMovie.production_countries),
            spoken_languages: this.parseJsonField<SpokenLanguage>(rawMovie.spoken_languages),
            keywords: this.parseJsonField<Keyword>(rawMovie.keywords),
            
            // Metadados
            inserted_at: now,
            updated_at: now
        };
    }

    async readCsvFile(filePath: string): Promise<RawMovieData[]> {
        return new Promise((resolve, reject) => {
            const movies: RawMovieData[] = [];
            
            console.log(`📖 Lendo arquivo CSV: ${filePath}`);
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row: RawMovieData) => {
                    movies.push(row);
                })
                .on('end', () => {
                    console.log(`✅ CSV lido com sucesso! ${movies.length} filmes encontrados.`);
                    resolve(movies);
                })
                .on('error', (error) => {
                    console.error('❌ Erro ao ler CSV:', error);
                    reject(error);
                });
        });
    }

    async insertMoviesBatch(movies: CleanMovieData[], batchSize: number = 1000): Promise<number> {
        if (!this.collection) {
            throw new Error('Conexão com MongoDB não estabelecida');
        }

        let totalInserted = 0;
        
        try {
            for (let i = 0; i < movies.length; i += batchSize) {
                const batch = movies.slice(i, i + batchSize);
                
                const result = await this.collection.insertMany(batch, { ordered: false });
                totalInserted += result.insertedCount;
                
                console.log(`📊 Inseridos ${result.insertedCount} filmes. Total: ${totalInserted}/${movies.length}`);
            }
            
            return totalInserted;
            
        } catch (error) {
            console.error('❌ Erro durante inserção em lote:', error);
            throw error;
        }
    }

    async createIndexes(): Promise<void> {
        if (!this.collection) {
            throw new Error('Conexão com MongoDB não estabelecida');
        }

        try {
            console.log('🔧 Criando índices...');
            
            // Índices simples
            await this.collection.createIndex({ movie_id: 1 }, { unique: true });
            await this.collection.createIndex({ title: 1 });
            await this.collection.createIndex({ release_date: -1 });
            await this.collection.createIndex({ vote_average: -1 });
            await this.collection.createIndex({ popularity: -1 });
            await this.collection.createIndex({ original_language: 1 });
            
            // Índices compostos
            await this.collection.createIndex({ vote_average: -1, vote_count: -1 });
            await this.collection.createIndex({ release_date: -1, popularity: -1 });
            
            // Índice de texto para busca
            await this.collection.createIndex({ 
                title: 'text', 
                overview: 'text', 
                tagline: 'text' 
            });
            
            console.log('✅ Índices criados com sucesso!');
            
        } catch (error) {
            console.warn('⚠️  Erro ao criar índices:', error);
        }
    }

    async getCollectionStats(): Promise<any> {
        if (!this.db) {
            throw new Error('Conexão com banco não estabelecida');
        }

        try {
            const stats = await this.db.stats();
            const count = await this.collection?.countDocuments() || 0;
            
            return {
                totalDocuments: count,
                databaseName: this.config.databaseName,
                collectionName: this.config.collectionName,
                indexes: await this.collection?.indexes() || []
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {};
        }
    }

    async processAndImport(csvFilePath: string): Promise<void> {
        try {
            // 1. Conectar ao MongoDB
            await this.connectToMongoDB();
            
            // 2. Ler arquivo CSV
            const rawMovies = await this.readCsvFile(csvFilePath);
            
            // 3. Processar e limpar dados
            console.log('🧹 Processando e limpando dados...');
            const cleanMovies = rawMovies.map(movie => this.cleanMovieData(movie));
            console.log(`✅ ${cleanMovies.length} filmes processados.`);
            
            // 4. Perguntar se deve limpar coleção existente
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const shouldClear = await new Promise<boolean>((resolve) => {
                readline.question('🗑️  Deseja limpar a coleção existente? (y/N): ', (answer: string) => {
                    readline.close();
                    resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
                });
            });
            
            if (shouldClear && this.collection) {
                await this.collection.deleteMany({});
                console.log('🧽 Coleção limpa.');
            }
            
            // 5. Inserir filmes
            console.log('💾 Inserindo filmes no MongoDB...');
            const totalInserted = await this.insertMoviesBatch(cleanMovies);
            
            // 6. Criar índices
            await this.createIndexes();
            
            // 7. Mostrar estatísticas
            const stats = await this.getCollectionStats();
            
            console.log('\n🎉 PROCESSO CONCLUÍDO COM SUCESSO!');
            console.log('═'.repeat(50));
            console.log(`📊 Total de filmes inseridos: ${totalInserted}`);
            console.log(`🗄️  Database: ${this.config.databaseName}`);
            console.log(`📁 Collection: ${this.config.collectionName}`);
            console.log(`🔍 Índices criados: ${stats.indexes?.length || 0}`);
            console.log('═'.repeat(50));
            
        } catch (error) {
            console.error('❌ Erro durante o processamento:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            console.log('🔌 Conexão com MongoDB fechada.');
        }
    }
}