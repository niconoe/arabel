# Notes

NEXT:
  - Write JJS code to load occurrences and show on map
- I use CSV (created from Access by jetread) files to implement import, but I have a full PostgreSQL copy of the DB on 
  the development machine for easier inspection: **arabel_access_copy**

# TODO
- Import script: make reporting better? (error, ..)
- create second page, create links in navbar?
- Configure test server?
- Data: LITERAATUUR table empty?
- Squares possiblement manquant à vérifier: 31UGR9503, 32ULA9898

# To discuss
- Release the code as Open Source?
- Familiar with GitHub?
- Should I do something (filter data), according to the "present" field in SOORTEN INFO 
- Database structure is pretty messy, if they want to improve one day.
- Report data import (date interpretation, ...) issues
- Data: all UTM squares in 31U zone? Apparently NOT (code with "KB"...) => PLEASE fot he future enter the full code!!
=> transfer import log to Frederik

# Data import process

1) convert access database to CSV using `jetread`. All useful data is in the 4 tables in uppercase:

```
./jetread spinnenatlas_20201007.mdb export "STAAL GEGEVENS" -fmt csv > staal_gegevens.csv

./jetread spinnenatlas_20201007.mdb export "LITERATUUR" -fmt csv > litteratuur.csv

./jetread spinnenatlas_20201007.mdb export "GEGEVENS" -fmt csv > gegevens.csv

./jetread spinnenatlas_20201007.mdb export "SOORTEN INFO" -fmt csv > soorten_info.csv
```

2) Copy those 4 files to ./data (keep the same filenames)

3) Run the full import script:

  $ python manage.py import_all_access

4) Make sure all grid data is in the database (see below)

5) Reconcile Access data and grid data:

  $ python manage.py join_station_squares

# Grid data

Grid data (=MGRS squares over Belgium) should be imported to the MgrsSquare model/table.
GeoDjango's layermapping utilipy can be used for that.
Source data in `grid_data` directory:
  - the mgrs5 file contains both 5km and 10mk squares all over Belgium (from https://github.com/BelgianBiodiversityPlatform/grids-belgium)
  - the mgrs1 data is split in two files for zone 31U and 32U (downloaded from https://earth-info.nga.mil/GandG/update/index.php?dir=coordsys&action=mgrs-1km-polyline-dloads and manually clipped)

# Test server configuration on Digital Ocean

## Most useful commands

Connect:

    $ ssh nnoe@arabel.niconoe.eu

Deploy from GitHub master branch:

    $ cd arabel && ./deploy_master.sh

Access postgres:

    $ sudo -i -u postgres
    $ psql

Run Django command:

    $ cd arabel
    $ source venv/bin/activate
    $ python manage.py migrate --settings=arabel.settings_local

Get log files

    $ sudo journalctl -u gunicorn_arabel.service

Restart gunicorn

    $ sudo systemctl restart gunicorn_arabel

## Configuration log

- I reuse an existing Droplet (Ubuntu 20.04) with another Django site running => configuration 
  should be simplified. Connection:
  
  $ ssh nnoe@188.166.88.50

I then restart from the [DO tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-django-with-postgres-nginx-and-gunicorn-on-ubuntu-20-04) 
and adapt as needed.

- We install all available updates
- We create an `arabel` database, and a dedicated user: arabel/ajkhl3456

Due to local settings, we need to run django commands like: $ python manage.py migrate --settings=arabel.settings_local

(with gunicorn, I had to update wsgi.py to refer to the correct settings, then I can run normally: $ gunicorn --bind 0.0.0.0:8000 arabel.wsgi)

Systemd socket file: `/etc/systemd/system/gunicorn_arabel.socket`
(in this file, I reference the UNIX socket `/run/gunicorn_arabel.sock`)

Systemd service file: `/etc/systemd/system/gunicorn_arabel.service`
  
=> all works, I also enable HTTPS via certbot following: https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04

from django.contrib.gis.utils import LayerMapping
from website.models import *
mapping = {'name': 'code', 'gzd': 'gzd', 'poly': 'POLYGON'}
lm = LayerMapping(MgrsSquare, '/home/nnoe/Downloads/utm5_grid_belgium.polygon.gpkg', mapping)
lm.save(verbose=True, strict=True)
