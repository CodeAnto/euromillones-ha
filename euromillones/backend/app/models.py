from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Sorteo(SQLModel, table=True):
    """Resultado oficial de un sorteo de Euromillones."""
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: date = Field(index=True, unique=True)
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    e1: int
    e2: int

    @property
    def numeros(self) -> list[int]:
        return sorted([self.n1, self.n2, self.n3, self.n4, self.n5])

    @property
    def estrellas(self) -> list[int]:
        return sorted([self.e1, self.e2])


class Ticket(SQLModel, table=True):
    """Ticket jugado por el usuario."""
    id: Optional[int] = Field(default=None, primary_key=True)
    creado: datetime = Field(default_factory=datetime.utcnow)
    fecha_sorteo: date = Field(index=True)
    estrategia: str
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    e1: int
    e2: int
    coste: float = 2.5
    aciertos_num: Optional[int] = None
    aciertos_estr: Optional[int] = None
    premio: Optional[float] = None
    reinvertido: float = 0.0  # parte del premio reinvertida en otra lotería
    notas: Optional[str] = None


class Gasto(SQLModel, table=True):
    """Gasto manual en otras loterías."""
    id: Optional[int] = Field(default=None, primary_key=True)
    creado: datetime = Field(default_factory=datetime.utcnow)
    fecha: date
    loteria: str
    importe: float
    premio: float = 0.0
    reinvertido: float = 0.0  # parte del premio reinvertida en otra lotería
    # Si este gasto vino de reinvertir un premio, dónde está el origen
    origen_tipo: Optional[str] = None     # 'ticket' | 'gasto'
    origen_id: Optional[int] = None
    notas: Optional[str] = None
