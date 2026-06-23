"""Generador de tickets con varias estrategias basadas en histórico."""
from __future__ import annotations
import random
from collections import Counter
from sqlmodel import Session, select
from .models import Sorteo

NUM_RANGE = range(1, 51)
STAR_RANGE = range(1, 13)

# Rango histórico típico de la suma de los 5 números en Euromillones (~aprox).
SUM_MIN, SUM_MAX = 95, 175


def _all_sorteos(session: Session) -> list[Sorteo]:
    return list(session.exec(select(Sorteo)))


def _freq(sorteos: list[Sorteo]) -> tuple[Counter, Counter]:
    nums: Counter = Counter()
    stars: Counter = Counter()
    for s in sorteos:
        nums.update([s.n1, s.n2, s.n3, s.n4, s.n5])
        stars.update([s.e1, s.e2])
    return nums, stars


def _weighted_sample(weights: dict[int, float], k: int, pool: range) -> list[int]:
    items = list(pool)
    w = [max(weights.get(i, 0.0), 0.0001) for i in items]
    out: set[int] = set()
    while len(out) < k:
        pick = random.choices(items, weights=w, k=1)[0]
        out.add(pick)
    return sorted(out)


def _balanced_valid(nums: list[int]) -> bool:
    s = sum(nums)
    if not (SUM_MIN <= s <= SUM_MAX):
        return False
    pares = sum(1 for n in nums if n % 2 == 0)
    if pares < 1 or pares > 4:  # evitar todo par / todo impar
        return False
    bajos = sum(1 for n in nums if n <= 25)
    if bajos < 1 or bajos > 4:
        return False
    # no más de 2 consecutivos
    seq = 1
    for i in range(1, len(nums)):
        if nums[i] == nums[i - 1] + 1:
            seq += 1
            if seq > 2:
                return False
        else:
            seq = 1
    return True


def gen_random() -> dict:
    return {
        "numeros": sorted(random.sample(list(NUM_RANGE), 5)),
        "estrellas": sorted(random.sample(list(STAR_RANGE), 2)),
    }


def gen_balanced() -> dict:
    for _ in range(2000):
        nums = sorted(random.sample(list(NUM_RANGE), 5))
        if _balanced_valid(nums):
            return {"numeros": nums, "estrellas": sorted(random.sample(list(STAR_RANGE), 2))}
    return gen_random()


def gen_hot(session: Session, lookback: int = 200) -> dict:
    sorteos = sorted(_all_sorteos(session), key=lambda s: s.fecha, reverse=True)[:lookback]
    if not sorteos:
        return gen_random()
    nums_c, stars_c = _freq(sorteos)
    return {
        "numeros": _weighted_sample({i: nums_c.get(i, 0) for i in NUM_RANGE}, 5, NUM_RANGE),
        "estrellas": _weighted_sample({i: stars_c.get(i, 0) for i in STAR_RANGE}, 2, STAR_RANGE),
    }


def gen_cold(session: Session, lookback: int = 200) -> dict:
    sorteos = sorted(_all_sorteos(session), key=lambda s: s.fecha, reverse=True)[:lookback]
    if not sorteos:
        return gen_random()
    nums_c, stars_c = _freq(sorteos)
    max_n = max(nums_c.values()) if nums_c else 1
    max_s = max(stars_c.values()) if stars_c else 1
    return {
        "numeros": _weighted_sample({i: max_n - nums_c.get(i, 0) + 1 for i in NUM_RANGE}, 5, NUM_RANGE),
        "estrellas": _weighted_sample({i: max_s - stars_c.get(i, 0) + 1 for i in STAR_RANGE}, 2, STAR_RANGE),
    }


def gen_smart_mix(session: Session) -> dict:
    """Combina: números balanceados con sesgo hot, estrellas hot."""
    sorteos = sorted(_all_sorteos(session), key=lambda s: s.fecha, reverse=True)[:200]
    if not sorteos:
        return gen_balanced()
    nums_c, stars_c = _freq(sorteos)
    for _ in range(2000):
        nums = _weighted_sample({i: nums_c.get(i, 0) + 1 for i in NUM_RANGE}, 5, NUM_RANGE)
        if _balanced_valid(nums):
            return {
                "numeros": nums,
                "estrellas": _weighted_sample({i: stars_c.get(i, 0) + 1 for i in STAR_RANGE}, 2, STAR_RANGE),
            }
    return gen_balanced()


STRATEGIES = {
    "random": "Aleatorio puro",
    "balanced": "Balanceado (suma, paridad, bajo/alto)",
    "hot": "Hot (más frecuentes recientes)",
    "cold": "Cold (atrasados)",
    "smart_mix": "Smart Mix (balanceado + hot)",
}


def generate(strategy: str, session: Session) -> dict:
    if strategy == "random":
        return gen_random()
    if strategy == "balanced":
        return gen_balanced()
    if strategy == "hot":
        return gen_hot(session)
    if strategy == "cold":
        return gen_cold(session)
    if strategy == "smart_mix":
        return gen_smart_mix(session)
    raise ValueError(f"Estrategia desconocida: {strategy}")
