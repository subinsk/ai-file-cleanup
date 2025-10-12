"""
Text embedding generation using Sentence Transformers
"""
import torch
import numpy as np
from typing import List
from app.core.models import get_text_model
from app.core.config import settings


def mean_pooling(model_output, attention_mask):
    """
    Mean pooling - take attention mask into account for correct averaging
    """
    token_embeddings = model_output[0]  # First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


async def generate_text_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts
    
    Args:
        texts: List of text strings
        
    Returns:
        List of embedding vectors (normalized)
    """
    if not texts:
        return []
    
    model, tokenizer = get_text_model()
    device = torch.device(settings.DEVICE)
    
    # Tokenize texts
    encoded_input = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors='pt'
    ).to(device)
    
    # Generate embeddings
    with torch.no_grad():
        model_output = model(**encoded_input)
    
    # Mean pooling
    embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
    
    # Normalize embeddings
    embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    
    # Convert to list
    embeddings_list = embeddings.cpu().numpy().tolist()
    
    return embeddings_list


async def generate_text_embedding(text: str) -> List[float]:
    """
    Generate embedding for a single text
    
    Args:
        text: Text string
        
    Returns:
        Embedding vector (normalized)
    """
    embeddings = await generate_text_embeddings([text])
    return embeddings[0]

