from website.management.commands._utils import ArabelCommand
from website.models import Station, NoMGRSData, MgrsSquare


class Command(ArabelCommand):
    help = "Create FK between stations and mgrss quares"

    def handle(self, *args, **options):
        for station in Station.objects.all():
            try:
                code, _ = station.most_detailed_mgrs_identifier()
                station.most_detailed_square = MgrsSquare.objects.get(name=code)
                station.save()
                self.w('.', ending="")
            except NoMGRSData:
                self.w(f"\nNo MGRS code for station {station.pk}")
            except MgrsSquare.DoesNotExist:
                self.w(f"\nStation {station.pk} has square code {code}, but such a square doesn't exist in the DB")

        self.w("DONE")
