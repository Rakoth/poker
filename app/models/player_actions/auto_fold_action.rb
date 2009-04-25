class PlayerActions::AutoFoldAction < PlayerActions::FoldAction
	private
	
	def perform!
		player_influence
	end
end
