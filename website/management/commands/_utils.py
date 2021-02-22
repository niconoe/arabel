from django.core.management import BaseCommand


class ArabelCommand(BaseCommand):
    def __init__(self, *args, **kwargs):
        super(ArabelCommand, self).__init__(*args, **kwargs)

        self.w = self.stdout.write  # Alias to save keystrokes :)