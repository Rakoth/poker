class SyncBuilder::Base
	def initialize object, options = {}
		@object = object
		@for_user = options[:for_user] if options.has_key? :for_user
	end

	def data
		raise 'Not Implemented'
	end

	def empty?
		data.empty?
	end

	def to_json options = {}
		data.to_json options
	end

	def method_missing method_name, *args
		@object.send(method_name, *args) if @object.respond_to?(method_name)
	end
end