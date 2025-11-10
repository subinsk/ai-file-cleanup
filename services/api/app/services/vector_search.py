"""
Optimized pgvector search service
Implements efficient similarity search with pagination and retrieval limits
"""
import logging
from typing import List, Dict, Any, Optional
from prisma import Prisma
from prisma.models import FileEmbedding, File

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Service for efficient pgvector similarity searches
    - Implements pagination
    - Adds retrieval limits to prevent memory overflow
    - Uses optimized SQL with IVFFLAT indexes
    """
    
    def __init__(
        self,
        db: Prisma,
        max_results: int = 1000,
        page_size: int = 50,
        vector_search_limit: int = 500
    ):
        self.db = db
        self.max_results = max_results
        self.page_size = page_size
        self.vector_search_limit = vector_search_limit
    
    async def search_similar_texts(
        self,
        embedding: List[float],
        distance_threshold: float = 0.3,
        limit: int = 100,
        offset: int = 0,
        exclude_file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for similar text embeddings
        
        Args:
            embedding: Query embedding vector
            distance_threshold: Maximum distance (cosine)
            limit: Maximum results per page
            offset: Pagination offset
            exclude_file_id: Optional file ID to exclude from results
            
        Returns:
            Dictionary with results and pagination info
        """
        # Limit the search to prevent memory overflow
        limit = min(limit, self.vector_search_limit)
        
        try:
            # Use raw SQL for efficient similarity search with indexes
            query = """
            SELECT 
                f."id",
                f."fileName",
                f."mimeType",
                f."sizeBytes",
                f."sha256",
                fe."embedding",
                1 - (fe."embedding" <-> $1::vector) as similarity
            FROM "file_embeddings" fe
            JOIN "files" f ON fe."fileId" = f."id"
            WHERE 
                fe."kind" = 'text'
                AND fe."embedding" IS NOT NULL
                AND (1 - (fe."embedding" <-> $1::vector)) > $2
                {exclude_clause}
            ORDER BY fe."embedding" <-> $1::vector
            LIMIT $3 OFFSET $4
            """.strip()
            
            # Add exclude clause if needed
            exclude_clause = f'AND fe."fileId" != ${5}' if exclude_file_id else ''
            query = query.replace('{exclude_clause}', exclude_clause)
            
            # Execute query with proper parameter binding
            params = [embedding, distance_threshold, limit, offset]
            if exclude_file_id:
                params.append(exclude_file_id)
            
            results = await self.db.query_raw(query, *params)
            
            logger.info(f"Text similarity search returned {len(results)} results")
            
            return {
                'results': results,
                'count': len(results),
                'limit': limit,
                'offset': offset,
                'has_more': len(results) >= limit
            }
            
        except Exception as e:
            logger.error(f"Text similarity search failed: {e}")
            raise
    
    async def search_similar_images(
        self,
        embedding: List[float],
        distance_threshold: float = 0.2,
        limit: int = 100,
        offset: int = 0,
        exclude_file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for similar image embeddings
        
        Args:
            embedding: Query embedding vector
            distance_threshold: Maximum distance (cosine)
            limit: Maximum results per page
            offset: Pagination offset
            exclude_file_id: Optional file ID to exclude from results
            
        Returns:
            Dictionary with results and pagination info
        """
        # Limit the search to prevent memory overflow
        limit = min(limit, self.vector_search_limit)
        
        try:
            # Use raw SQL for efficient similarity search with indexes
            query = """
            SELECT 
                f."id",
                f."fileName",
                f."mimeType",
                f."sizeBytes",
                f."sha256",
                fe."embeddingImg",
                1 - (fe."embeddingImg" <-> $1::vector) as similarity
            FROM "file_embeddings" fe
            JOIN "files" f ON fe."fileId" = f."id"
            WHERE 
                fe."kind" = 'image'
                AND fe."embeddingImg" IS NOT NULL
                AND (1 - (fe."embeddingImg" <-> $1::vector)) > $2
                {exclude_clause}
            ORDER BY fe."embeddingImg" <-> $1::vector
            LIMIT $3 OFFSET $4
            """.strip()
            
            # Add exclude clause if needed
            exclude_clause = f'AND fe."fileId" != ${5}' if exclude_file_id else ''
            query = query.replace('{exclude_clause}', exclude_clause)
            
            # Execute query with proper parameter binding
            params = [embedding, distance_threshold, limit, offset]
            if exclude_file_id:
                params.append(exclude_file_id)
            
            results = await self.db.query_raw(query, *params)
            
            logger.info(f"Image similarity search returned {len(results)} results")
            
            return {
                'results': results,
                'count': len(results),
                'limit': limit,
                'offset': offset,
                'has_more': len(results) >= limit
            }
            
        except Exception as e:
            logger.error(f"Image similarity search failed: {e}")
            raise
    
    async def find_duplicates_in_upload(
        self,
        upload_id: str,
        similarity_threshold: float = 0.85,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """
        Find duplicate groups within an upload
        
        Args:
            upload_id: Upload ID to search within
            similarity_threshold: Minimum similarity for duplicates
            limit: Maximum total results
            
        Returns:
            Dictionary with duplicate groups
        """
        try:
            # Get all files in upload with their embeddings
            files_with_embeddings = await self.db.file.find_many(
                where={'upload_id': upload_id},
                include={'embedding': True},
                take=limit
            )
            
            duplicate_groups = {}
            processed = 0
            
            for i, file in enumerate(files_with_embeddings):
                if not file.embedding or not file.embedding.embedding:
                    continue
                
                processed += 1
                
                # Skip if already in a group
                if file.id in duplicate_groups:
                    continue
                
                # Find similar files
                similar = await self.search_similar_texts(
                    embedding=file.embedding.embedding,
                    distance_threshold=1 - similarity_threshold,
                    limit=50,
                    exclude_file_id=file.id
                )
                
                if similar['results']:
                    duplicate_groups[file.id] = {
                        'file': file,
                        'similar_files': similar['results'],
                        'similarity_score': similar['results'][0]['similarity'] if similar['results'] else 0
                    }
            
            logger.info(f"Found {len(duplicate_groups)} duplicate groups in upload {upload_id}")
            logger.info(f"Processed {processed}/{len(files_with_embeddings)} files with embeddings")
            
            return {
                'upload_id': upload_id,
                'groups': duplicate_groups,
                'group_count': len(duplicate_groups),
                'files_processed': processed
            }
            
        except Exception as e:
            logger.error(f"Duplicate finding failed: {e}")
            raise
    
    def get_optimization_stats(self) -> Dict[str, Any]:
        """Get optimization configuration"""
        return {
            'max_results': self.max_results,
            'page_size': self.page_size,
            'vector_search_limit': self.vector_search_limit,
            'index_type': 'IVFFLAT',
            'recommendations': [
                'Ensure pgvector indexes are created with: CREATE INDEX ... USING ivfflat',
                'Adjust IVFFLAT lists parameter based on dataset size (100 for 1M items)',
                'Use pagination to avoid loading large result sets into memory',
                'Set vector_search_limit to control query execution time'
            ]
        }
