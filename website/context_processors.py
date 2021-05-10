from website.utils import get_source_version_info


def git_version_processor(request):
    return {'git_revision_string': get_source_version_info()}