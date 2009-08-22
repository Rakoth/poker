class Conf
	include Singleton
	def self.[] key
		@@config ||= YAML.load_file("#{RAILS_ROOT}/config/config.yml")[RAILS_ENV]
		@@config[key.to_s]
	end
end