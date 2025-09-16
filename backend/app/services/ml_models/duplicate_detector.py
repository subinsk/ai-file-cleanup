"""
Duplicate detection using various ML techniques
"""

import hashlib
import os
from typing import List, Tuple, Dict, Any
import asyncio
from pathlib import Path
import numpy as np
from PIL import Image
import cv2


class DuplicateDetector:
    """Service for detecting duplicate and similar files"""
    
    def __init__(self):
        self.similarity_threshold = 0.8
        self.perceptual_hash_size = 8  # 8x8 hash for perceptual similarity
    
    async def find_duplicates(self, file_list: List[str]) -> List[Tuple[str, str, float]]:
        """Find duplicate files in a list"""
        try:
            print(f"🔍 Duplicate detector: Checking {len(file_list)} files")
            duplicates = []
            
            # Group files by size first (quick filter)
            size_groups = self._group_by_size(file_list)
            print(f"📊 Duplicate detector: Grouped into {len(size_groups)} size groups")
            
            for size, files in size_groups.items():
                if len(files) < 2:
                    print(f"📁 Size {size}: {len(files)} files (skipping)")
                    continue
                
                print(f"📁 Size {size}: {len(files)} files (checking)")
                
                # Check for exact duplicates (hash-based)
                exact_duplicates = await self._find_exact_duplicates(files)
                print(f"🔍 Found {len(exact_duplicates)} exact duplicates")
                duplicates.extend(exact_duplicates)
                
                # Check for similar files (perceptual/semantic)
                similar_files = await self._find_similar_files(files)
                print(f"🔍 Found {len(similar_files)} similar files")
                duplicates.extend(similar_files)
            
            print(f"🎯 Total duplicates found: {len(duplicates)}")
            return duplicates
            
        except Exception as e:
            print(f"❌ Error finding duplicates: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _group_by_size(self, file_list: List[str]) -> Dict[int, List[str]]:
        """Group files by size for efficient comparison"""
        size_groups = {}
        
        for file_path in file_list:
            try:
                size = os.path.getsize(file_path)
                if size not in size_groups:
                    size_groups[size] = []
                size_groups[size].append(file_path)
            except Exception as e:
                print(f"Error getting size for {file_path}: {e}")
                continue
        
        return size_groups
    
    async def _find_exact_duplicates(self, files: List[str]) -> List[Tuple[str, str, float]]:
        """Find exact duplicates using hash comparison"""
        try:
            print(f"🔍 Checking {len(files)} files for exact duplicates")
            duplicates = []
            hashes = {}
            
            for file_path in files:
                print(f"🔐 Calculating hash for: {file_path}")
                file_hash = await self._calculate_file_hash(file_path)
                print(f"🔐 Hash: {file_hash}")
                
                if file_hash in hashes:
                    # Found duplicate
                    print(f"✅ Found duplicate: {hashes[file_hash]} <-> {file_path}")
                    duplicates.append((hashes[file_hash], file_path, 1.0))
                else:
                    hashes[file_hash] = file_path
                    print(f"📝 New unique file: {file_path}")
            
            print(f"🎯 Found {len(duplicates)} exact duplicate pairs")
            return duplicates
            
        except Exception as e:
            print(f"❌ Error finding exact duplicates: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def _find_similar_files(self, files: List[str]) -> List[Tuple[str, str, float]]:
        """Find similar files using perceptual hashing"""
        try:
            duplicates = []
            
            # Only process image files for perceptual hashing
            image_files = [f for f in files if self._is_image_file(f)]
            
            if len(image_files) < 2:
                return []
            
            # Calculate perceptual hashes
            hashes = {}
            for file_path in image_files:
                try:
                    phash = await self._calculate_perceptual_hash(file_path)
                    if phash:
                        hashes[file_path] = phash
                except Exception as e:
                    print(f"Error calculating perceptual hash for {file_path}: {e}")
                    continue
            
            # Compare hashes
            file_list = list(hashes.keys())
            for i in range(len(file_list)):
                for j in range(i + 1, len(file_list)):
                    file1, file2 = file_list[i], file_list[j]
                    similarity = self._calculate_hash_similarity(
                        hashes[file1], hashes[file2]
                    )
                    
                    if similarity >= self.similarity_threshold:
                        duplicates.append((file1, file2, similarity))
            
            return duplicates
            
        except Exception as e:
            print(f"Error finding similar files: {e}")
            return []
    
    async def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate MD5 hash of file"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            print(f"Error calculating hash for {file_path}: {e}")
            return ""
    
    async def _calculate_perceptual_hash(self, file_path: str) -> str:
        """Calculate perceptual hash for image similarity"""
        try:
            # Check if file exists and is readable
            if not os.path.exists(file_path):
                print(f"Image file does not exist: {file_path}")
                return ""
            
            # Load image with better error handling
            try:
                image = Image.open(file_path)
                # Verify the image is valid
                image.verify()
            except Exception as img_error:
                print(f"Invalid image file {file_path}: {img_error}")
                return ""
            
            # Reopen the image (verify() closes it)
            image = Image.open(file_path)
            image = image.convert('L')  # Convert to grayscale
            image = image.resize((self.perceptual_hash_size, self.perceptual_hash_size))
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Calculate average
            avg = img_array.mean()
            
            # Create hash based on whether each pixel is above or below average
            hash_bits = []
            for row in img_array:
                for pixel in row:
                    hash_bits.append('1' if pixel > avg else '0')
            
            # Convert to hex
            hash_string = ''.join(hash_bits)
            hash_int = int(hash_string, 2)
            return hex(hash_int)[2:].zfill(16)
            
        except Exception as e:
            print(f"Error calculating perceptual hash for {file_path}: {e}")
            return ""
    
    def _calculate_hash_similarity(self, hash1: str, hash2: str) -> float:
        """Calculate similarity between two perceptual hashes"""
        try:
            if len(hash1) != len(hash2):
                return 0.0
            
            # Convert to binary
            bin1 = bin(int(hash1, 16))[2:].zfill(len(hash1) * 4)
            bin2 = bin(int(hash2, 16))[2:].zfill(len(hash2) * 4)
            
            # Calculate Hamming distance
            hamming_distance = sum(c1 != c2 for c1, c2 in zip(bin1, bin2))
            
            # Convert to similarity (0-1)
            max_distance = len(bin1)
            similarity = 1.0 - (hamming_distance / max_distance)
            
            return similarity
            
        except Exception as e:
            print(f"Error calculating hash similarity: {e}")
            return 0.0
    
    def _is_image_file(self, file_path: str) -> bool:
        """Check if file is an image"""
        try:
            ext = Path(file_path).suffix.lower()
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
            return ext in image_extensions
        except:
            return False
    
    async def calculate_content_similarity(self, file1_path: str, file2_path: str) -> float:
        """Calculate content-based similarity between two files"""
        try:
            # For text files, use text similarity
            if self._is_text_file(file1_path) and self._is_text_file(file2_path):
                return await self._calculate_text_similarity(file1_path, file2_path)
            
            # For image files, use perceptual hashing
            elif self._is_image_file(file1_path) and self._is_image_file(file2_path):
                return await self._calculate_image_similarity(file1_path, file2_path)
            
            # For other files, use hash comparison
            else:
                return await self._calculate_hash_similarity_files(file1_path, file2_path)
                
        except Exception as e:
            print(f"Error calculating content similarity: {e}")
            return 0.0
    
    def _is_text_file(self, file_path: str) -> bool:
        """Check if file is a text file"""
        try:
            ext = Path(file_path).suffix.lower()
            text_extensions = {'.txt', '.md', '.py', '.js', '.ts', '.java', '.cpp', '.c', '.h', '.html', '.css', '.xml', '.json'}
            return ext in text_extensions
        except:
            return False
    
    async def _calculate_text_similarity(self, file1_path: str, file2_path: str) -> float:
        """Calculate similarity between text files"""
        try:
            # Read file contents
            with open(file1_path, 'r', encoding='utf-8', errors='ignore') as f:
                content1 = f.read()
            
            with open(file2_path, 'r', encoding='utf-8', errors='ignore') as f:
                content2 = f.read()
            
            # Simple similarity based on common words
            words1 = set(content1.lower().split())
            words2 = set(content2.lower().split())
            
            if not words1 or not words2:
                return 0.0
            
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            similarity = len(intersection) / len(union)
            return similarity
            
        except Exception as e:
            print(f"Error calculating text similarity: {e}")
            return 0.0
    
    async def _calculate_image_similarity(self, file1_path: str, file2_path: str) -> float:
        """Calculate similarity between image files"""
        try:
            hash1 = await self._calculate_perceptual_hash(file1_path)
            hash2 = await self._calculate_perceptual_hash(file2_path)
            
            if not hash1 or not hash2:
                return 0.0
            
            return self._calculate_hash_similarity(hash1, hash2)
            
        except Exception as e:
            print(f"Error calculating image similarity: {e}")
            return 0.0
    
    async def _calculate_hash_similarity_files(self, file1_path: str, file2_path: str) -> float:
        """Calculate hash-based similarity between files"""
        try:
            hash1 = await self._calculate_file_hash(file1_path)
            hash2 = await self._calculate_file_hash(file2_path)
            
            if hash1 == hash2:
                return 1.0
            else:
                return 0.0
                
        except Exception as e:
            print(f"Error calculating hash similarity: {e}")
            return 0.0
