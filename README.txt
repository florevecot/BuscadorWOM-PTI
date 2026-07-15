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
