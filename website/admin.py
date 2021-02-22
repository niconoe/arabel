from django.contrib import admin

from website.models import Family, Species, Station


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    pass


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    pass


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    pass