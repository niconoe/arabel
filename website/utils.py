import os


def get_source_version_info():
    return os.environ.get('GIT_REVISION', 'unknown')