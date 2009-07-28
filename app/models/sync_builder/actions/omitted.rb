class SyncBuilder::Actions::Omitted
	def initialize actions
		@last_action_id = actions[-1].id
		@actions = actions.map do |action|
			is_last_action = action == actions[-1]
			SyncBuilder::Actions::Single.new(action, is_last_action)
		end
	end
end
