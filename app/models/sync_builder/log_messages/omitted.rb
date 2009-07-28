class SyncBuilder::LogMessages::Omitted
	def initialize messages
		@messages = messages.map {|action| SyncBuilder::LogMessages::Single.new action}
	end

	def to_json options = {}
		@messages.to_json options
	end
end