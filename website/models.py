from django.contrib.gis.db import models
from django.urls import reverse


class Publication(models.Model):  # = Access table "LITTERATUUR"
    access_id = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=50, unique=True)
    year = models.IntegerField()
    still_checking = models.BooleanField()  # "Nog controlleren" in source data
    not_relevant = models.BooleanField()  # "Niet relevant"
    ingegeven = models.BooleanField()
    publication = models.TextField()


class Family(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=5, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Families"


class RedListStatus(models.Model):
    access_id = models.IntegerField()
    name = models.CharField(max_length=255)


class Species(models.Model):
    fsc = models.CharField(max_length=50, unique=True)  # This is the PK in access, it appears to be the family code concatenated with a species code
    family = models.ForeignKey(Family, on_delete=models.PROTECT)
    scientific_name = models.CharField(max_length=255)
    scientific_name_w_authorship = models.CharField(max_length=255)
    vernacular_name_nl = models.CharField(max_length=255, blank=True)
    redlist_status = models.ForeignKey(RedListStatus, on_delete=models.PROTECT, blank=True, null=True)

    def as_dict(self):
        return {
            "id": self.pk,
            "scientific_name": self.scientific_name,
            "family_id": self.family_id,
            "family_name": self.family.name,
            "vernacular_name_nl": self.vernacular_name_nl,
            "redlist_status_text": self.redlist_status.name
        }

    def __str__(self):
        return self.scientific_name

    class Meta:
        verbose_name_plural = "Species"
        ordering = ['scientific_name']


class NoMGRSData(Exception):
    pass


class MgrsSquare(models.Model):
    name = models.CharField(max_length=9)
    gzd = models.CharField(max_length=3)
    poly = models.PolygonField()

    def get_absolute_url(self):
        return reverse('website-square-details', kwargs={"square_id": self.pk})

    def as_dict(self):
        return {
            'id': self.pk,
            'gzd': self.gzd,
            'name': self.name,
            'geojson_str': self.poly.json
        }


def get_mgrs_prefix(code):
    if code[0] == 'K' or code[0] == 'L':
        return '32U'
    else:
        return '31U'


class Station(models.Model):
    staal_id = models.CharField(max_length=50, unique=True)  # PK in Access
    station_name = models.CharField(max_length=50)
    area = models.CharField(max_length=255, blank=True)  # "Gebied" in access
    subarea = models.CharField(max_length=255, null=True)  # "Deelgebied" in Access

    utm10_code = models.CharField(max_length=4, blank=True)
    utm5_code = models.CharField(max_length=5, blank=True)
    utm1_code = models.CharField(max_length=6, blank=True)

    leg = models.CharField(max_length=255, blank=True)
    det = models.CharField(max_length=255, blank=True)
    habitat_description = models.CharField(max_length=255, blank=True)  # Biotoopomschrijving

    begin_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    publication_reference = models.CharField(max_length=50, blank=True)  # reference to publication code, as a string straight from Access
    publication = models.ForeignKey(Publication, on_delete=models.PROTECT, null=True, blank=True)

    most_detailed_square = models.ForeignKey(MgrsSquare, blank=True, null=True, on_delete=models.PROTECT, related_name='stations_mostdetailed_set')
    _5_or_10_square = models.ForeignKey(MgrsSquare, blank=True, null=True, on_delete=models.PROTECT, related_name='stations_5or10_set')

    class Meta:
        ordering = ['station_name']

    def most_detailed_mgrs_identifier(self , limit_to_5=False):
        """Return the identifier and type (1-5-10)

        if limit_to_5 is True, avoid returning 1km square even if we have them (might bring confusion on the map,
        see https://github.com/niconoe/arabel/issues/8.
        """
        if self.utm1_code != '' and limit_to_5 is False:
            return (f"{get_mgrs_prefix(self.utm1_code)}{self.utm1_code}", 1)
        elif self.utm5_code != '':
            return (f"{get_mgrs_prefix(self.utm5_code)}{self.utm5_code}", 5)
        elif self.utm10_code != '':
            return (f"{get_mgrs_prefix(self.utm10_code)}{self.utm10_code}", 10)
        else:
            raise NoMGRSData

    def __str__(self):
        return self.station_name

    def as_dict(self):
        publication_code = None
        publication_id = None
        if self.publication:
            publication_code = self.publication.code
            publication_id = self.publication_id

        return {
            'id': self.pk,
            'name': self.station_name,
            'staal_id': self.staal_id,
            'area': self.area,
            'subarea': self.subarea,
            'most_detailed_square_id': self.most_detailed_square_id,
            'publication_code': publication_code,
            'publication_id': publication_id
        }


class Occurrence(models.Model):  # = GEGEVENS in Access
    record_id = models.IntegerField()  # From access, for traceability
    station = models.ForeignKey(Station, on_delete=models.PROTECT)
    species = models.ForeignKey(Species, on_delete=models.PROTECT)
    date = models.DateField(blank=True, null=True)
    individual_count = models.IntegerField(default=1)

    @property
    def date_isoformat(self):
        if self.date:
            return self.date.isoformat()
        else:
            return None

    def as_dict(self):
        most_detailed_square_name = None
        if self.station and self.station.most_detailed_square:
            most_detailed_square_name = self.station.most_detailed_square.name

        publication_year = None
        publication_str = None
        publication_code = None
        publication_id = None
        if self.station and self.station.publication:
            publication_year = self.station.publication.year
            publication_str = self.station.publication.publication
            publication_code = self.station.publication.code
            publication_id = self.station.publication_id

        return {
            "id": self.pk,
            "individual_count": self.individual_count,
            "date": self.date_isoformat,
            "station_id": self.station_id,
            "station_name": self.station.station_name,
            "station_staal_id": self.station.staal_id,
            "station_area": self.station.area,
            "station_subarea": self.station.subarea,
            "station_most_detailed_square": most_detailed_square_name,
            "station_leg": self.station.leg,
            "station_det": self.station.det,
            "species_id": self.species_id,

            "station_publication_year": publication_year,
            "station_publication_code": publication_code,
            "station_publication_str": publication_str,
            "station_publication_id": publication_id
        }