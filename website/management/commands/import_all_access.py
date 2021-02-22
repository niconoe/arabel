import csv
import os
import datetime

from website.management.commands._utils import ArabelCommand
from website.models import Species, Family, Station

MODELS_TO_TRUNCATE = [Species, Family, Station]

SPECIES_INFO_FILENAME = 'soorten_info.csv'
STATIONS_FILENAME = 'staal_gegevens.csv'

THIS_SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))


class Command(ArabelCommand):
    help = "Import data from Access (in 4 csv files) to Django's database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--truncate',
            action='store_true',
            dest='truncate',
            default=True,
            help='!! CAUTION !! Truncate webapp data prior to import.',
        )

    def load_families_and_species(self, soorten_info_data):
        self.w("Will now import Family and Species data")
        for i, species_row in enumerate(csv.DictReader(soorten_info_data)):
            family, _ = Family.objects.get_or_create(name=species_row['FA'].capitalize(), code=species_row['FC'])

            Species.objects.create(family=family,
                                   fsc=species_row['FSC'],
                                   scientific_name=species_row['SZ + SYN'],
                                   scientific_name_w_authorship=species_row['SA + SYN'],
                                   vernacular_name_nl=species_row['SNL'])
            self.w('.', ending='')

    def load_stations(self, stations_data):
        self.w("Will now import Stations data")
        for i, station_row in enumerate(csv.DictReader(stations_data)):

            # 1. Data preparation/cleanup (when possible): dates
            begin_date = None
            if station_row['Begin jaar'] != '' and station_row['Begin maand'] != '' and station_row['Begin dag'] != '':
                try:
                    begin_date = datetime.date(int(station_row['Begin jaar']),
                                               int(station_row['Begin maand']),
                                               int(station_row['Begin dag']))
                except ValueError:
                    self.w(self.style.WARNING(f"Error parsing begin date for row: {station_row}"))

            end_date = None
            if station_row['Eind jaar'] != '' and station_row['Eind maand'] != '' and station_row['Eind dag'] != '':
                try:
                    end_date = datetime.date(int(station_row['Eind jaar']),
                                             int(station_row['Eind maand']),
                                             int(station_row['Eind dag']))
                except ValueError:
                    self.w(self.style.WARNING(f"Error parsing end date for row: {station_row}"))

            # 2. Data preparation/cleanup (when possible): UTM codes
            utm_10_code = station_row['UTM10'].replace(" ", "")  # Some blank spaces floating around...
            if len(utm_10_code) > 4:
                self.w(self.style.WARNING(f"UTM10 code too long for row: {station_row}"))
                utm_10_code = ''

            utm_5_code = station_row['UTM5'].replace(" ", "")  # Some blank spaces floating around...
            if len(utm_5_code) > 5:
                self.w(self.style.WARNING(f"UTM5 code too long for row: {station_row}"))
                utm_5_code = ''

            utm_1_code = station_row['UTM1'].replace(" ", "")  # Some blank spaces floating around...
            if len(utm_1_code) > 6:
                self.w(self.style.WARNING(f"UTM1 code too long for row: {station_row}"))
                utm_1_code = ''

            # 3. Creating objects
            Station.objects.create(staal_id=station_row['StaalID'],
                                   station_name=station_row['Naam station'],
                                   area=station_row['Gebied'],
                                   subarea=station_row['Deelgebied'],
                                   utm10_code=utm_10_code,
                                   utm5_code=utm_5_code,
                                   utm1_code=utm_1_code,
                                   leg=station_row['Leg'],
                                   det=station_row['Det'],
                                   habitat_description=station_row['Biotoopomschrijving'],
                                   begin_date=begin_date,
                                   end_date=end_date,
                                   )
            self.w('.', ending='')

    def handle(self, *args, **options):
        if options['truncate']:
            for model in MODELS_TO_TRUNCATE:
                self.w('Truncate model {name}...'.format(name=model.__name__), ending='')
                model.objects.all().delete()
                self.w(self.style.SUCCESS('Done.'))

        with open(os.path.join(THIS_SCRIPT_DIR, "../../../data", SPECIES_INFO_FILENAME)) as soorten_info_data:
            self.load_families_and_species(soorten_info_data)

        with open(os.path.join(THIS_SCRIPT_DIR, "../../../data", STATIONS_FILENAME)) as stations_data:
            self.load_stations(stations_data)

        self.w(self.style.SUCCESS('Finished importing.'))




