export interface Genre {
    id: number;
    name: string;
}

export interface ProductionCompany {
    id: number;
    name: string;
    logo_path?: string;
    origin_country: string;
}

export interface ProductionCountry {
    iso_3166_1: string;
    name: string;
}

export interface SpokenLanguage {
    iso_639_1: string;
    name: string;
    english_name: string;
}

export interface Keyword {
    id: number;
    name: string;
}

export interface RawMovieData {
    id: string;
    title: string;
    vote_average: string;
    vote_count: string;
    status: string;
    release_date: string;
    revenue: string;
    runtime: string;
    adult: string;
    backdrop_path: string;
    budget: string;
    homepage: string;
    imdb_id: string;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: string;
    poster_path: string;
    tagline: string;
    genres: string;
    production_companies: string;
    production_countries: string;
    spoken_languages: string;
    keywords: string;
}

export interface CleanMovieData {
    movie_id: number;
    title: string;
    original_title: string;
    overview: string;
    tagline: string;
    status: string;
    release_date: Date | null;
    runtime: number;
    adult: boolean;
    original_language: string;
    homepage: string;
    imdb_id: string;
    budget: number;
    revenue: number;
    vote_average: number;
    vote_count: number;
    popularity: number;
    backdrop_path: string;
    poster_path: string;
    genres: Genre[];
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    spoken_languages: SpokenLanguage[];
    keywords: Keyword[];
    inserted_at: Date;
    updated_at: Date;
}