# TODO
- occurrence search: proper message if empty table
- occurrence search: show numer of occurrences in <select>?
- occurrence search: (option to) group <select> by family


# Arabel

Source code for the (future) Atlas of spiders (ARABEL Database). 

Implemented with Python, Django and Vue.js

## Data import process

1) convert access database to CSV using `jetread`. All useful data is in the tables listed below:

```
./jetread spinnenatlas_20201007.mdb export "STAAL GEGEVENS" -fmt csv > staal_gegevens.csv

./jetread spinnenatlas_20201007.mdb export "LITERATUUR" -fmt csv > litteratuur.csv

./jetread spinnenatlas_20201007.mdb export "GEGEVENS" -fmt csv > gegevens.csv

./jetread spinnenatlas_20201007.mdb export "SOORTEN INFO" -fmt csv > soorten_info.csv

./jetread spinnenatlas_20201007.mdb export "Omschrijving Rode lijst categoriën" -fmt csv > redlist_categories.csv
```

2) Copy those 4 files to ./data (keep the same filenames)

3) Run the full import script:

  $ python manage.py import_all_access

4) Make sure all grid data is in the database (see point below)

5) Reconcile Access data and grid data:

  $ python manage.py join_station_squares

## Importing grid data

Grid data (=MGRS squares over Belgium) should be imported to the MgrsSquare model/table.
GeoDjango's layermapping utility can be used for that. Source data in `grid_data` directory:
  - the mgrs5 file contains both 5km and 10mk squares all over Belgium (from https://github.com/BelgianBiodiversityPlatform/grids-belgium)
  - the mgrs1 data is split in two files for zone 31U and 32U (downloaded from https://earth-info.nga.mil/GandG/update/index.php?dir=coordsys&action=mgrs-1km-polyline-dloads and manually clipped)

Example:

    from django.contrib.gis.utils import LayerMapping
    from website.models import *
    mapping = {'name': 'code', 'gzd': 'gzd', 'poly': 'POLYGON'}
    lm = LayerMapping(MgrsSquare, '/home/nnoe/Downloads/utm5_grid_belgium.polygon.gpkg', mapping)
    lm.save(verbose=True, strict=True)
