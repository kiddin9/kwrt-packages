
OS_PROP_FAMILY                 = "family"
OS_PROP_DISTRO                 = "distro"
OS_PROP_RELEASE_STATUS         = "release-status"
OS_PROP_KERNEL_URL_ARGUMENT    = "kernel-url-argument"
OS_PROP_CLOUD_IMAGE_USERNAME   = "cloud-image-username"

OS_PROP_SHORT_ID            = 'short-id'
OS_PROP_NAME                = 'name'

class Os:
	def __init__(self):
		self.short_id = None
		self.name = None
		pass
	def get_short_id(self):
		return self.short_id
	def get_id(self):
		return self.short_id
	def get_name(self):
		return self.name
	def get_family(self):
		return None
	def get_codename(self):
		return None
	def get_distro(self):
		return None
	def get_version(self):
		return None
	def get_eol_date(self):
		return None
	def get_release_date(self):
		return None
	def get_param_value(self, prop):
		return None
	def set_param(self, prop, value):
		if prop == OS_PROP_SHORT_ID:
			self.short_id = value
		elif prop == OS_PROP_NAME:
			self.name = value
		pass

