class PlayerActions::AutoFoldAction < PlayerActions::FoldAction

	def kind
		AUTO_FOLD
	end

	private
	
	def perform!
		player_influence
	end
end
