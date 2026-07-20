BUSCADOR WOM-PTI v3
====================

NOVEDADES
---------
- Los sitios WOM siempre se muestran morados.
- Capa con todos los PTI.
- Búsqueda opcional de vivienda o edificio cercano mediante OpenStreetMap.
- Radio PTI independiente: 50 a 5.000 m, predeterminado 400 m.
- Radio vivienda independiente: 50 a 2.000 m, predeterminado 300 m.
- Primero busca edificios residenciales explícitos.
- Si no encuentra, busca cualquier edificio.
- Interruptor para prender/apagar la función.
- La búsqueda de vivienda se ejecuta con botón para evitar consultas innecesarias.

ARCHIVOS REALES
---------------
Reemplaza únicamente:
data/Sitios.geojson
data/PTI.csv

EJECUCIÓN LOCAL
---------------
py -m http.server 8000

Abrir:
http://localhost:8000

CREDENCIALES BÁSICAS
--------------------
Usuario: OOEEWOM
Contraseña: PTI2026

NOTA IMPORTANTE
---------------
El login es una barrera visual, no autenticación segura.
Los edificios provienen de OpenStreetMap y su cobertura puede ser incompleta.
La distancia de vivienda se calcula respecto del centro del objeto OSM,
no necesariamente al borde más cercano de la construcción.


NOVEDADES v4
------------
- Botón "Nueva búsqueda".
- Restablece radio PTI a 400 m y vivienda a 300 m.
- Elimina selección, círculos, líneas y resultados.
- Regresa suavemente a la vista inicial de Chile.
- Botón para copiar el ID.
- Botón para abrir el sitio en Google Maps.
- Notificaciones tipo toast.
- La búsqueda con Enter sigue disponible.


NOVEDADES v5
------------
- Análisis masivo de todos los sitios WOM.
- PTI más cercano y vivienda/edificio cercano.
- Barra de progreso, cancelación y descarga CSV.
- Resultados parciales disponibles si se cancela.
- CSV compatible con Excel en configuración chilena.
