from django.contrib.gis.db import models


class Family(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=5, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Families"


class Species(models.Model):
    fsc = models.CharField(max_length=50, unique=True)  # This is the PK in access, it appears to be the family code concatenated with a species code
    family = models.ForeignKey(Family, on_delete=models.PROTECT)
    scientific_name = models.CharField(max_length=255)
    scientific_name_w_authorship = models.CharField(max_length=255)
    vernacular_name_nl = models.CharField(max_length=255, blank=True)

    def as_dict(self):
        return {
            "id": self.pk,
            "scientific_name": self.scientific_name,
            "family_id": self.family_id
        }

    def __str__(self):
        return self.scientific_name

    class Meta:
        verbose_name_plural = "Species"


class NoMGRSData(Exception):
    pass


class MgrsSquare(models.Model):
    name = models.CharField(max_length=9)
    gzd = models.CharField(max_length=3)
    poly = models.PolygonField()


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

    most_detailed_square = models.ForeignKey(MgrsSquare, blank=True, null=True, on_delete=models.PROTECT)

    def most_detailed_mgrs_identifier(self):
        """Return the identifier and type (1-5-10)"""
        if self.utm1_code != '':
            return (f"{get_mgrs_prefix(self.utm1_code)}{self.utm1_code}", 1)
        elif self.utm5_code != '':
            return (f"{get_mgrs_prefix(self.utm5_code)}{self.utm5_code}", 5)
        elif self.utm10_code != '':
            return (f"{get_mgrs_prefix(self.utm10_code)}{self.utm10_code}", 10)
        else:
            raise NoMGRSData

    def __str__(self):
        return self.station_name


class Occurrence(models.Model):  # = GEGEVENS in Access
    record_id = models.IntegerField()  # From access, for traceability
    station = models.ForeignKey(Station, on_delete=models.PROTECT)
    species = models.ForeignKey(Species, on_delete=models.PROTECT)
    date = models.DateField(blank=True, null=True)
    individual_count = models.IntegerField(default=1)