-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create text search configuration for address search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function for address similarity search
CREATE OR REPLACE FUNCTION search_address(query_text TEXT, limit_count INT DEFAULT 10)
RETURNS TABLE(bbl VARCHAR, full_address VARCHAR, similarity REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.bbl,
        b.full_address,
        similarity(b.full_address, query_text) AS sim
    FROM buildings b
    WHERE b.full_address % query_text
    ORDER BY sim DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
