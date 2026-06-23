from datetime import date, datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Sorteo, Ticket, Gasto
from . import generator, scraper, stats

app = FastAPI(title="Euromillones — stack-anto", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


# ---------- Schemas ----------
class GenerateReq(BaseModel):
    estrategia: str = "smart_mix"


class GenerateResp(BaseModel):
    estrategia: str
    numeros: list[int]
    estrellas: list[int]


class TicketIn(BaseModel):
    fecha_sorteo: date
    estrategia: str
    numeros: list[int] = Field(min_length=5, max_length=5)
    estrellas: list[int] = Field(min_length=2, max_length=2)
    coste: float = 2.5
    notas: Optional[str] = None


class TicketUpdate(BaseModel):
    premio: Optional[float] = None
    notas: Optional[str] = None


class GastoIn(BaseModel):
    fecha: date
    loteria: str
    importe: float
    premio: float = 0.0
    notas: Optional[str] = None


class ReinvertirIn(BaseModel):
    origen_tipo: str  # 'ticket' | 'gasto'
    origen_id: int
    importe: float
    loteria: str
    fecha: date
    notas: Optional[str] = None


# ---------- Generación ----------
@app.get("/strategies")
def list_strategies():
    return generator.STRATEGIES


@app.post("/generate", response_model=GenerateResp)
def generate_ticket(req: GenerateReq, s: Session = Depends(get_session)):
    if req.estrategia not in generator.STRATEGIES:
        raise HTTPException(400, "Estrategia inválida")
    out = generator.generate(req.estrategia, s)
    return GenerateResp(estrategia=req.estrategia, **out)


# ---------- Tickets ----------
def _check_against_sorteo(t: Ticket, s: Session) -> Ticket:
    sorteo = s.exec(select(Sorteo).where(Sorteo.fecha == t.fecha_sorteo)).first()
    if sorteo:
        nums_t = {t.n1, t.n2, t.n3, t.n4, t.n5}
        estr_t = {t.e1, t.e2}
        t.aciertos_num = len(nums_t & set(sorteo.numeros))
        t.aciertos_estr = len(estr_t & set(sorteo.estrellas))
    return t


@app.post("/tickets")
def crear_ticket(data: TicketIn, s: Session = Depends(get_session)):
    n = sorted(data.numeros)
    e = sorted(data.estrellas)
    if not all(1 <= x <= 50 for x in n) or len(set(n)) != 5:
        raise HTTPException(400, "Números inválidos")
    if not all(1 <= x <= 12 for x in e) or len(set(e)) != 2:
        raise HTTPException(400, "Estrellas inválidas")
    t = Ticket(
        fecha_sorteo=data.fecha_sorteo,
        estrategia=data.estrategia,
        n1=n[0], n2=n[1], n3=n[2], n4=n[3], n5=n[4],
        e1=e[0], e2=e[1],
        coste=data.coste,
        notas=data.notas,
    )
    _check_against_sorteo(t, s)
    s.add(t)
    s.commit()
    s.refresh(t)
    return t


@app.get("/tickets")
def listar_tickets(s: Session = Depends(get_session)):
    rows = s.exec(select(Ticket).order_by(Ticket.fecha_sorteo.desc())).all()
    return rows


@app.patch("/tickets/{ticket_id}")
def actualizar_ticket(ticket_id: int, data: TicketUpdate, s: Session = Depends(get_session)):
    t = s.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(404, "Ticket no encontrado")
    if data.premio is not None:
        t.premio = data.premio
    if data.notas is not None:
        t.notas = data.notas
    s.add(t)
    s.commit()
    s.refresh(t)
    return t


@app.delete("/tickets/{ticket_id}")
def borrar_ticket(ticket_id: int, s: Session = Depends(get_session)):
    t = s.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(404)
    s.delete(t)
    s.commit()
    return {"ok": True}


# ---------- Gastos manuales ----------
@app.post("/gastos")
def crear_gasto(data: GastoIn, s: Session = Depends(get_session)):
    g = Gasto(**data.model_dump())
    s.add(g)
    s.commit()
    s.refresh(g)
    return g


@app.get("/gastos")
def listar_gastos(s: Session = Depends(get_session)):
    return s.exec(select(Gasto).order_by(Gasto.fecha.desc())).all()


@app.delete("/gastos/{gasto_id}")
def borrar_gasto(gasto_id: int, s: Session = Depends(get_session)):
    g = s.get(Gasto, gasto_id)
    if not g:
        raise HTTPException(404)
    s.delete(g)
    s.commit()
    return {"ok": True}


# ---------- Sorteos / Sync ----------
@app.get("/sorteos")
def listar_sorteos(limit: int = 50, s: Session = Depends(get_session)):
    rows = s.exec(select(Sorteo).order_by(Sorteo.fecha.desc()).limit(limit)).all()
    return rows


@app.post("/sorteos/sync")
def sync_sorteos(
    desde: int = 2004,
    hasta: int = datetime.now().year,
    s: Session = Depends(get_session),
):
    years = list(range(desde, hasta + 1))
    resumen = scraper.sync_years(s, years)
    # Re-comprobar tickets sin aciertos contra los nuevos sorteos
    tickets = s.exec(select(Ticket).where(Ticket.aciertos_num.is_(None))).all()
    for t in tickets:
        _check_against_sorteo(t, s)
        s.add(t)
    s.commit()
    return resumen


# ---------- Stats ----------
@app.post("/reinvertir")
def reinvertir(data: ReinvertirIn, s: Session = Depends(get_session)):
    """Mueve parte del premio de un ticket/gasto a un nuevo Gasto en otra lotería.

    No reduce el premio del origen — solo aumenta su `reinvertido`, para que el
    desglose pueda distinguir entre "premio retirado" y "premio que dio vueltas".
    """
    if data.origen_tipo not in ("ticket", "gasto"):
        raise HTTPException(400, "origen_tipo debe ser 'ticket' o 'gasto'")
    if data.importe <= 0:
        raise HTTPException(400, "Importe debe ser positivo")

    if data.origen_tipo == "ticket":
        origen = s.get(Ticket, data.origen_id)
    else:
        origen = s.get(Gasto, data.origen_id)
    if not origen:
        raise HTTPException(404, "Origen no encontrado")

    premio = (origen.premio or 0) if data.origen_tipo == "ticket" else origen.premio
    ya_reinv = origen.reinvertido or 0
    disponible = premio - ya_reinv
    if data.importe > disponible + 0.001:
        raise HTTPException(
            400,
            f"No puedes reinvertir {data.importe:.2f} €. Disponible: {disponible:.2f} €.",
        )

    nuevo = Gasto(
        fecha=data.fecha,
        loteria=data.loteria,
        importe=data.importe,
        premio=0.0,
        origen_tipo=data.origen_tipo,
        origen_id=data.origen_id,
        notas=data.notas or f"Reinversión de {data.origen_tipo} #{data.origen_id}",
    )
    origen.reinvertido = ya_reinv + data.importe
    s.add(origen)
    s.add(nuevo)
    s.commit()
    s.refresh(nuevo)
    return {"reinversion": nuevo, "origen_actualizado": origen}


@app.get("/stats/balance")
def stats_balance(s: Session = Depends(get_session)):
    return stats.balance(s)


@app.get("/stats/por-mes")
def stats_por_mes(s: Session = Depends(get_session)):
    return stats.por_mes(s)


@app.get("/stats/frecuencias")
def stats_freq(s: Session = Depends(get_session)):
    return stats.freq_global(s)


@app.get("/stats/resumen")
def stats_resumen(s: Session = Depends(get_session)):
    return stats.resumen(s)


@app.get("/health")
def health():
    return {"ok": True}


# ---------- Backup / Restore ----------
class BackupPayload(BaseModel):
    version: int = 1
    exported_at: str
    tickets: list[dict]
    gastos: list[dict]
    sorteos: list[dict] = []


@app.get("/backup/export")
def backup_export(incluir_sorteos: bool = True, s: Session = Depends(get_session)):
    """Devuelve un JSON con toda la BD del usuario.

    Los sorteos oficiales se incluyen por defecto pero se pueden omitir (se pueden
    re-descargar con /sorteos/sync), reduciendo mucho el tamaño del fichero.
    """
    def serialize(obj):
        d = obj.model_dump()
        for k, v in d.items():
            if isinstance(v, (date, datetime)):
                d[k] = v.isoformat()
        return d

    tickets = [serialize(t) for t in s.exec(select(Ticket)).all()]
    gastos = [serialize(g) for g in s.exec(select(Gasto)).all()]
    sorteos = [serialize(x) for x in s.exec(select(Sorteo)).all()] if incluir_sorteos else []
    return {
        "version": 1,
        "exported_at": datetime.utcnow().isoformat(),
        "tickets": tickets,
        "gastos": gastos,
        "sorteos": sorteos,
    }


@app.post("/backup/import")
def backup_import(
    payload: BackupPayload,
    modo: str = "merge",   # 'merge' (no toca lo que ya tienes) | 'replace' (vacía y restaura)
    s: Session = Depends(get_session),
):
    """Importa un backup JSON.

    - merge: añade lo que no exista (sorteos por fecha, tickets/gastos por id).
    - replace: borra TODOS los tickets/gastos/sorteos actuales y restaura el backup.
    """
    if modo not in ("merge", "replace"):
        raise HTTPException(400, "modo debe ser 'merge' o 'replace'")

    if modo == "replace":
        for row in s.exec(select(Ticket)).all(): s.delete(row)
        for row in s.exec(select(Gasto)).all(): s.delete(row)
        for row in s.exec(select(Sorteo)).all(): s.delete(row)
        s.commit()

    def to_date(v):
        return date.fromisoformat(v) if isinstance(v, str) else v

    def to_dt(v):
        return datetime.fromisoformat(v) if isinstance(v, str) else v

    added = {"tickets": 0, "gastos": 0, "sorteos": 0}

    # Sorteos por fecha
    fechas_existentes = {x.fecha for x in s.exec(select(Sorteo)).all()}
    for raw in payload.sorteos:
        f = to_date(raw.get("fecha"))
        if f in fechas_existentes:
            continue
        s.add(Sorteo(
            fecha=f,
            n1=raw["n1"], n2=raw["n2"], n3=raw["n3"], n4=raw["n4"], n5=raw["n5"],
            e1=raw["e1"], e2=raw["e2"],
        ))
        added["sorteos"] += 1

    # Tickets — siempre crea filas nuevas (no se reusa id antiguo)
    for raw in payload.tickets:
        raw = {**raw}
        raw.pop("id", None)
        raw["fecha_sorteo"] = to_date(raw.get("fecha_sorteo"))
        raw["creado"] = to_dt(raw.get("creado")) or datetime.utcnow()
        s.add(Ticket(**raw))
        added["tickets"] += 1

    for raw in payload.gastos:
        raw = {**raw}
        raw.pop("id", None)
        raw["fecha"] = to_date(raw.get("fecha"))
        raw["creado"] = to_dt(raw.get("creado")) or datetime.utcnow()
        s.add(Gasto(**raw))
        added["gastos"] += 1

    s.commit()
    return {"modo": modo, "añadidos": added}
