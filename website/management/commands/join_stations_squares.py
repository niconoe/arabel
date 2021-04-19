from website.management.commands._utils import ArabelCommand
from website.models import Station, NoMGRSData, MgrsSquare


class Command(ArabelCommand):
    help = "Create FK between stations and mgrss quares"

    def handle(self, *args, **options):
        for station in Station.objects.all():
            try:
                code_details, _ = station.most_detailed_mgrs_identifier()
                station.most_detailed_square = MgrsSquare.objects.get(name=code_details)

                code_5_or_10, _ = station.most_detailed_mgrs_identifier(limit_to_5=True)
                station._5_or_10_square = MgrsSquare.objects.get(name=code_5_or_10)
                station.save()
                self.w('.', ending="")
            except NoMGRSData:
                self.w(f"\nNo MGRS code for station {station.pk}")
            except MgrsSquare.DoesNotExist:
                self.w(
                    f"\nStation {station.pk} references square codes {code_details} and {code_5_or_10}, but at least one of those is missing in the squares table")

        self.w("DONE")
