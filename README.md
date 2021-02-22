# Notes

- I use CSV (created from Access by jetread) files to implement import, but I have a full PostgreSQL copy of the DB on 
  the development machine for easier inspection: **arabel_access_copy**

# TODO
- create second page, create links in navbar?
- Configure test server?
- Data: LITERAATUUR table empty?


# To discuss
- Release the code as Open Source?
- Familiar with GitHub?
- Should I do something (filter data), according to the "present" field in SOORTEN INFO 
- Database structure is pretty messy, if they want to improve one day.
- Report data import (date interpretation, ...) issues

# Data import process

1) convert access database to CSV using `jetread`. All useful data is in the 4 tables in uppercase:

```
./jetread spinnenatlas_20201007.mdb export "STAAL GEGEVENS" -fmt csv > staal_gegevens.csv

./jetread spinnenatlas_20201007.mdb export "LITERATUUR" -fmt csv > litteratuur.csv

./jetread spinnenatlas_20201007.mdb export "GEGEVENS" -fmt csv > gegevens.csv

./jetread spinnenatlas_20201007.mdb export "SOORTEN INFO" -fmt csv > soorten_info.csv
```

2) Copy those 4 files to ./data (keep the same filenames)

3) Run the full import script
