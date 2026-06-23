# Euromillones — Add-on de Home Assistant

Generador de tickets, tracker de gastos y estadísticas del Euromillones, empaquetado
como add-on de Home Assistant. Es la misma app que el `docker-compose`, pero corriendo
en un solo contenedor gestionado desde el panel de HA.

## Qué hace

- **Generar**: 5 estrategias (aleatorio, balanceado, hot, cold, smart_mix).
- **Mis tickets**: guarda tus jugadas, calcula aciertos al sincronizar el sorteo,
  registra premios y permite reinvertirlos.
- **Gastos**: lleva la cuenta de lo que te gastas por tipo de lotería.
- **Stats**: balance, resumen psicológico, frecuencias e histórico.
- **Backup**: exportar/importar todo en JSON.

## Instalación

1. En Home Assistant → **Ajustes → Add-ons → Tienda de add-ons**.
2. Menú (⋮ arriba a la derecha) → **Repositorios** → añade:
   `https://github.com/CodeAnto/euromillones`
3. Aparecerá **Euromillones** en la lista. Pulsa **Instalar**.
4. **Arranca** el add-on y abre la web en `http://homeassistant.local:5337`.

## Datos

La base de datos SQLite se guarda en `/data/euromillones.db`, que Home Assistant
**persiste automáticamente** entre reinicios y actualizaciones del add-on.

Para migrar datos desde el docker-compose anterior: usa el botón **Exportar backup**
en la app vieja y el botón **Importar backup** en esta.

## Puerto

- `5337` → interfaz web (configurable en la pestaña *Configuración* del add-on).
