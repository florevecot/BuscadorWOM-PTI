BUSCADOR WOM-PTI
=================

1. Reemplaza los archivos de ejemplo:
   data/Sitios.geojson
   data/PTI.csv

2. El GeoJSON debe ser FeatureCollection y contener un campo ID.

3. PTI.csv debe incluir columnas equivalentes a:
   Nombre, Latitud, Longitud

   También reconoce:
   Name / PTI / Sitio
   Latitude / Lat
   Longuitud / Longitude / Lon / Lng

4. Abre CMD dentro de la carpeta del proyecto y ejecuta:

   py -m http.server 8000

5. Abre en Chrome:

   http://localhost:8000

6. Si el navegador mantiene una versión antigua:
   - Presiona F12.
   - Ve a Network.
   - Marca Disable cache.
   - Presiona Ctrl + F5.

Funciones incluidas:
- Buscar por ID, comuna o región.
- Autocompletado.
- Radio ajustable de 50 a 5000 metros.
- PTI más cercano, incluso fuera del radio.
- Lista de PTI dentro del radio.
- Estadísticas de distancia.
- Línea entre sitio WOM y PTI.
- Mapa de calles y satélite.
- Popup con todas las columnas de PTI.csv.
- Exportación a CSV.
- URL compartible mediante ?id=AN0900.
