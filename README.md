# Movies CSV to MongoDB

Projeto em TypeScript para importar dados de filmes de um arquivo CSV para uma coleção MongoDB, com limpeza de dados, criação de índices e exemplos de consultas.

## Sumário
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Formato do CSV](#formato-do-csv)
- [Exemplo de uso](#exemplo-de-uso)
- [Consultas de exemplo](#consultas-de-exemplo)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Observações](#observações)

---

## Pré-requisitos
- Node.js >= 18
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ou instância MongoDB local

## Configuração
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```env
   MONGO_CONNECTION_STRING=SuaStringDeConexaoMongoDB
   MONGO_DATABASE=movies_db
   MONGO_COLLECTION=movies
   ```
   - **MONGO_CONNECTION_STRING**: String de conexão do MongoDB Atlas ou local.
   - **MONGO_DATABASE**: Nome do banco de dados (padrão: movies_db).
   - **MONGO_COLLECTION**: Nome da coleção (padrão: movies).

## Como rodar o projeto
### 1. Testar conexão com o MongoDB
```bash
npm run test-connection
```

### 2. Importar o CSV para o MongoDB
```bash
npm run dev
```
Ou, se preferir, compile e rode:
```bash
npm run build
npm start
```

O sistema irá pedir o caminho do arquivo CSV. Exemplo:
```
📁 Digite o caminho do arquivo CSV: data/TMDB_movie_dataset_v11.csv
```

- O caminho pode ser relativo à raiz do projeto ou absoluto.
- O arquivo CSV pode estar em qualquer pasta, desde que o caminho informado seja correto.

## Formato do CSV
O arquivo CSV deve conter o cabeçalho e os campos esperados pelo importador. Exemplo de cabeçalho e uma linha:

```csv
id,title,vote_average,vote_count,status,release_date,revenue,runtime,adult,backdrop_path,budget,homepage,imdb_id,original_language,original_title,overview,popularity,poster_path,tagline,genres,production_companies,production_countries,spoken_languages,keywords
"27205","Inception","8.364","34495","Released","2010-07-15","825532764","148","False","/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg","160000000","https://www.warnerbros.com/movies/inception","tt1375666","en","Inception","Cobb, a skilled thief...","83.952","/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg","Your mind is the scene of the crime.","Action, Science Fiction, Adventure","Legendary Pictures, Syncopy, Warner Bros. Pictures","United Kingdom, United States of America","English, French, Japanese, Swahili","rescue, mission, dream, airplane, ..."
```

- Os campos como `genres`, `production_companies`, `production_countries`, `spoken_languages` e `keywords` podem estar como listas separadas por vírgula ou como strings JSON. O importador faz o parsing automaticamente.

## Exemplo de uso
1. Execute o comando de importação:
   ```bash
   npm run dev
   ```
2. Informe o caminho do arquivo CSV quando solicitado.
3. O sistema irá:
   - Conectar ao MongoDB
   - Ler e processar o CSV
   - Limpar e transformar os dados
   - Perguntar se deseja limpar a coleção existente
   - Inserir os dados em lote
   - Criar índices automaticamente
   - Exibir estatísticas

## Consultas de exemplo
Você pode rodar consultas de exemplo usando:
```bash
npx ts-node src/queries-example.ts
```
Exemplos de consultas disponíveis:
- Total de filmes
- Top 5 filmes mais populares
- Top 5 filmes com maior receita
- Gêneros mais comuns
- Filmes por década

## Estrutura do Projeto
```
├── data/                  # Coloque aqui seus arquivos CSV
├── src/
│   ├── index.ts           # Ponto de entrada do importador
│   ├── services/
│   │   └── MoviesImporter.ts  # Lógica de importação, limpeza e indexação
│   ├── types/
│   │   └── Movie.ts       # Tipos e interfaces dos dados
│   ├── queries-example.ts # Exemplos de queries MongoDB
│   └── test-connection.ts # Teste de conexão com o banco
├── package.json
├── tsconfig.json
└── .env                   # (adicione este arquivo manualmente)
```

## Observações
- O projeto cria índices automaticamente para acelerar buscas por título, data, popularidade, etc.
- O importador faz parsing de campos complexos (como listas de gêneros) mesmo se vierem como string simples.
- Não suba seu arquivo `.env` para o GitHub (já está no `.gitignore`).
- O código está todo comentado e em português para facilitar a avaliação.

---

Qualquer dúvida, consulte os comentários no código ou abra uma issue! 