class Conf
	include Singleton
	def self.[] key
		@@instance ||= YAML.load_file("#{RAILS_ROOT}/config/config.yml")[RAILS_ENV]
		@@instance[key.to_s]
	end
end