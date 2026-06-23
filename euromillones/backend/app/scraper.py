"""Scraper del histórico de euromillones.com.es.

Estructura: una tabla por año con columnas SEM | SORTEO | DIA | NÚMEROS | ESTRELLAS | MILLÓN.
La fecha viene como 'DD-mmm' (sin año), se compone con el año de la URL.
"""
from __future__ import annotations
import re
from datetime import date
import httpx
from bs4 import BeautifulSoup
from sqlmodel import Session, select
from .models import Sorteo

BASE_URL = "https://www.euromillones.com.es/historico/resultados-euromillones-{year}.html"

MESES = {
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
    "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12,
}


def _parse_fecha(texto: str, year: int) -> date | None:
    m = re.match(r"(\d{1,2})[-/\s]([a-záéíóú]{3})", texto.strip().lower())
    if not m:
        return None
    dia = int(m.group(1))
    mes = MESES.get(m.group(2)[:3])
    if not mes:
        return None
    try:
        return date(year, mes, dia)
    except ValueError:
        return None


def _parse_numeros(texto: str) -> list[int]:
    return [int(n) for n in re.findall(r"\d+", texto)]


def fetch_year(year: int, client: httpx.Client) -> list[Sorteo]:
    """Descarga y parsea el HTML del año dado, devuelve lista de Sorteo (sin guardar).

    Formato real de la tabla (euromillones.com.es):
    [SEM?] | SORTEO | DIA | n1 | n2 | n3 | n4 | n5 | e1 | e2 | MILLON
    La celda de fecha es la primera con formato 'DD-mmm'. A partir de ahí:
    5 siguientes = números, 2 siguientes = estrellas.
    """
    url = BASE_URL.format(year=year)
    r = client.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0 stack-anto"})
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    sorteos: list[Sorteo] = []
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = [c.get_text(" ", strip=True) for c in row.find_all("td")]
            if len(cells) < 9:
                continue

            # Localizar la celda de fecha
            fecha = None
            idx_fecha = -1
            for i, c in enumerate(cells):
                f = _parse_fecha(c, year)
                if f:
                    fecha = f
                    idx_fecha = i
                    break
            if not fecha:
                continue

            # Necesitamos 5 números + 2 estrellas tras la fecha
            siguientes = cells[idx_fecha + 1: idx_fecha + 8]
            if len(siguientes) < 7:
                continue
            try:
                nums_raw = [int(x) for x in siguientes[:5]]
                estr_raw = [int(x) for x in siguientes[5:7]]
            except ValueError:
                continue

            n = sorted(nums_raw)
            e = sorted(estr_raw)
            if (len(set(n)) == 5 and len(set(e)) == 2
                    and all(1 <= x <= 50 for x in n)
                    and all(1 <= x <= 12 for x in e)):
                sorteos.append(Sorteo(
                    fecha=fecha,
                    n1=n[0], n2=n[1], n3=n[2], n4=n[3], n5=n[4],
                    e1=e[0], e2=e[1],
                ))
    return sorteos


def sync_years(session: Session, years: list[int]) -> dict:
    """Sincroniza varios años. Devuelve resumen."""
    nuevos = 0
    total = 0
    errores: list[str] = []
    with httpx.Client(follow_redirects=True) as client:
        for y in years:
            try:
                sorteos = fetch_year(y, client)
                total += len(sorteos)
                for s in sorteos:
                    existente = session.exec(
                        select(Sorteo).where(Sorteo.fecha == s.fecha)
                    ).first()
                    if existente is None:
                        session.add(s)
                        nuevos += 1
                session.commit()
            except Exception as exc:
                errores.append(f"{y}: {exc}")
    return {"years": years, "sorteos_vistos": total, "nuevos": nuevos, "errores": errores}
