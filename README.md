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

# Data import process

1) convert access database to CSV using `jetread`. All useful data is in the 4 tables in uppercase:

```
./jetread spinnenatlas_20201007.mdb export "STAAL GEGEVENS" -fmt csv > spinnenatlas_20201007_staal_gegevens.csv

./jetread spinnenatlas_20201007.mdb export "LITERATUUR" -fmt csv > spinnenatlas_20201007_litteratuur.csv

./jetread spinnenatlas_20201007.mdb export "GEGEVENS" -fmt csv > spinnenatlas_20201007_gegevens.csv

./jetread spinnenatlas_20201007.mdb export "SOORTEN INFO" -fmt csv > spinnenatlas_20201007_soorten_info.csv
```

