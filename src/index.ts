import { MoviesImporter } from './services/MoviesImporter';
import readline from 'readline';
import path from 'path';
import fs from 'fs';

async function main(): Promise<void> {
    try {
        console.log('🎬 Movies CSV to MongoDB - TypeScript Version');
        console.log('═'.repeat(50));
        
        // Interface para entrada do usuário
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Solicitar caminho do arquivo CSV
        const csvPath = await new Promise<string>((resolve) => {
            rl.question('📁 Digite o caminho do arquivo CSV: ', (answer) => {
                resolve(answer.trim());
            });
        });
        
        rl.close();
        
        // Verificar se arquivo existe
        if (!fs.existsSync(csvPath)) {
            console.error(`❌ Arquivo não encontrado: ${csvPath}`);
            process.exit(1);
        }
        
        // Criar instância do importador
        const importer = new MoviesImporter();
        
        // Processar e importar
        await importer.processAndImport(csvPath);
        
    } catch (error) {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    }
}

// Executar apenas se for o arquivo principal
if (require.main === module) {
    main();
}

export { MoviesImporter };