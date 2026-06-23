from collections import Counter
from datetime import date, timedelta
from sqlmodel import Session, select
from .models import Sorteo, Ticket, Gasto


def freq_global(session: Session) -> dict:
    sorteos = list(session.exec(select(Sorteo)))
    nums: Counter = Counter()
    stars: Counter = Counter()
    for s in sorteos:
        nums.update([s.n1, s.n2, s.n3, s.n4, s.n5])
        stars.update([s.e1, s.e2])
    return {
        "total_sorteos": len(sorteos),
        "numeros": [{"n": i, "veces": nums.get(i, 0)} for i in range(1, 51)],
        "estrellas": [{"n": i, "veces": stars.get(i, 0)} for i in range(1, 13)],
    }


def _aggregate(tickets: list[Ticket], gastos: list[Gasto]) -> dict:
    gasto_bruto = sum(t.coste for t in tickets) + sum(g.importe for g in gastos)
    premio_bruto = sum((t.premio or 0) for t in tickets) + sum(g.premio for g in gastos)
    reinvertido = sum((t.reinvertido or 0) for t in tickets) + sum(g.reinvertido for g in gastos)

    # gasto de bolsillo = gasto bruto - reinvertido (lo reinvertido NO salió del bolsillo)
    gasto_bolsillo = gasto_bruto - reinvertido
    # premio retirado = lo cobrado de verdad
    premio_retirado = premio_bruto - reinvertido
    balance_real = premio_retirado - gasto_bolsillo  # == premio_bruto - gasto_bruto

    return {
        "gasto_bruto": round(gasto_bruto, 2),
        "premio_bruto": round(premio_bruto, 2),
        "reinvertido": round(reinvertido, 2),
        "gasto_bolsillo": round(gasto_bolsillo, 2),
        "premio_retirado": round(premio_retirado, 2),
        "balance": round(balance_real, 2),
    }


def balance(session: Session) -> dict:
    tickets = list(session.exec(select(Ticket)))
    gastos = list(session.exec(select(Gasto)))

    # Filtrar para distinguir gastos "originales" vs reinversiones
    gastos_originales = [g for g in gastos if g.origen_tipo is None]
    gastos_reinvertidos = [g for g in gastos if g.origen_tipo is not None]

    return {
        "euromillones": {
            "tickets": len(tickets),
            **_aggregate(tickets, []),
        },
        "otras": {
            "registros": len(gastos_originales),
            **_aggregate([], gastos_originales),
        },
        "reinversiones": {
            "count": len(gastos_reinvertidos),
            **_aggregate([], gastos_reinvertidos),
        },
        "total": _aggregate(tickets, gastos),
    }


def por_mes(session: Session) -> list[dict]:
    tickets = list(session.exec(select(Ticket)))
    gastos = list(session.exec(select(Gasto)))
    agg: dict[str, dict] = {}

    def bucket(k):
        return agg.setdefault(k, {"mes": k, "gasto": 0.0, "premio": 0.0, "reinvertido": 0.0})

    for t in tickets:
        d = bucket(t.fecha_sorteo.strftime("%Y-%m"))
        d["gasto"] += t.coste
        d["premio"] += t.premio or 0
        d["reinvertido"] += t.reinvertido or 0
    for g in gastos:
        d = bucket(g.fecha.strftime("%Y-%m"))
        d["gasto"] += g.importe
        d["premio"] += g.premio
        d["reinvertido"] += g.reinvertido

    out = []
    for v in agg.values():
        out.append({
            "mes": v["mes"],
            "gasto": round(v["gasto"], 2),
            "premio": round(v["premio"], 2),
            "gasto_bolsillo": round(v["gasto"] - v["reinvertido"], 2),
            "premio_retirado": round(v["premio"] - v["reinvertido"], 2),
        })
    return sorted(out, key=lambda x: x["mes"])


def resumen(session: Session) -> dict:
    """Veredicto sobre la salud del gasto en lotería."""
    tickets = list(session.exec(select(Ticket)))
    gastos = list(session.exec(select(Gasto)))
    agg = _aggregate(tickets, gastos)

    fechas = (
        [t.fecha_sorteo for t in tickets]
        + [g.fecha for g in gastos]
    )
    if not fechas:
        return {
            "nivel": "sin_datos",
            "titulo": "Sin datos todavía",
            "mensaje": "Aún no has registrado tickets ni gastos. Cuando empieces a jugar aparecerá aquí el análisis.",
            "metricas": {},
            "avisos": [],
        }

    primera = min(fechas)
    hoy = date.today()
    dias_activo = max((hoy - primera).days, 1)
    # Si llevas menos de 30 días, no extrapoles: el gasto/mes sería poco fiable.
    pocos_datos = dias_activo < 30
    meses_activo = max(dias_activo / 30.4, 1.0)
    gasto_mes = agg["gasto_bolsillo"] / meses_activo
    recup = (agg["premio_bruto"] / agg["gasto_bruto"]) if agg["gasto_bruto"] > 0 else 0
    ratio_reinv = (agg["reinvertido"] / agg["premio_bruto"]) if agg["premio_bruto"] > 0 else 0

    # Con pocos datos, dar veredicto provisional simple y salir
    if pocos_datos:
        return {
            "nivel": "sin_datos",
            "titulo": "Aún no hay base suficiente",
            "mensaje": (
                f"Llevas {dias_activo} día(s) activo y has gastado "
                f"{agg['gasto_bolsillo']:.2f} € de tu bolsillo. "
                "Necesito al menos 30 días para dar un veredicto fiable sobre tu ritmo de gasto."
            ),
            "metricas": {
                "dias_activo": dias_activo,
                "gasto_acumulado_bolsillo": round(agg["gasto_bolsillo"], 2),
                "tasa_recuperacion": round(recup * 100, 1),
                "ratio_reinversion": round(ratio_reinv * 100, 1),
            },
            "avisos": [],
        }

    # Tendencia: gasto últimos 90 días vs 90 anteriores
    corte_reciente = hoy - timedelta(days=90)
    corte_antes = hoy - timedelta(days=180)
    g_reciente = sum(t.coste for t in tickets if t.fecha_sorteo >= corte_reciente) \
        + sum(g.importe for g in gastos if g.fecha >= corte_reciente)
    g_antes = sum(t.coste for t in tickets if corte_antes <= t.fecha_sorteo < corte_reciente) \
        + sum(g.importe for g in gastos if corte_antes <= g.fecha < corte_reciente)
    tendencia = None
    if g_antes > 0:
        tendencia = (g_reciente - g_antes) / g_antes  # +0.5 = +50%

    # Nivel principal por gasto/mes
    if gasto_mes < 10:
        nivel = "sano"
        titulo = "Pasatiempo sano"
        mensaje = f"Gastas unos {gasto_mes:.1f} €/mes de tu bolsillo. Es ocio razonable — al nivel de invitar a una caña al azar."
    elif gasto_mes < 30:
        nivel = "ok"
        titulo = "Ocio razonable"
        mensaje = f"Gastas {gasto_mes:.1f} €/mes. Está dentro de lo razonable. Mantén el ritmo, no escales."
    elif gasto_mes < 100:
        nivel = "atencion"
        titulo = "Atención: gasto elevado"
        mensaje = f"Gastas {gasto_mes:.1f} €/mes de tu bolsillo. Pregúntate si te divierte o si estás persiguiendo recuperar lo perdido."
    else:
        nivel = "alerta"
        titulo = "🚨 Considera reducir"
        mensaje = f"Gastas {gasto_mes:.1f} €/mes. A este ritmo la lotería ya no es ocio. Plantéate un tope mensual fijo."

    avisos: list[str] = []
    if ratio_reinv > 0.7 and agg["premio_bruto"] > 0:
        avisos.append(
            f"Reinviertes el {ratio_reinv*100:.0f}% de lo que ganas. Es el bucle clásico del jugador: la lotería se queda dinero que ya era tuyo sin que lo notes."
        )
    if tendencia is not None and tendencia > 0.5:
        avisos.append(
            f"Tu gasto ha subido un {tendencia*100:.0f}% en los últimos 90 días. Vigila la tendencia."
        )
    if agg["balance"] > 0 and agg["gasto_bruto"] > 20:
        avisos.append(
            "Estás en positivo. Disfrútalo, pero no asumas que va a continuar — estadísticamente la casa siempre gana a largo plazo."
        )
    if recup < 0.2 and agg["gasto_bruto"] > 50:
        avisos.append(
            f"Has recuperado solo el {recup*100:.0f}% de lo gastado. Es lo normal en este tipo de juego, pero conviene tenerlo presente."
        )

    return {
        "nivel": nivel,
        "titulo": titulo,
        "mensaje": mensaje,
        "metricas": {
            "dias_activo": dias_activo,
            "gasto_mes_bolsillo": round(gasto_mes, 2),
            "tasa_recuperacion": round(recup * 100, 1),
            "ratio_reinversion": round(ratio_reinv * 100, 1),
            "tendencia_90d": round(tendencia * 100, 1) if tendencia is not None else None,
        },
        "avisos": avisos,
    }
