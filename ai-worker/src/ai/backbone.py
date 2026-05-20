"""Load the embedding model once (L2-normalized outputs)."""
import logging
from functools import lru_cache
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def get_model():
    logger.info("Loading model: %s", MODEL_NAME)
    return SentenceTransformer(MODEL_NAME)


def encode(texts):
    return get_model().encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )