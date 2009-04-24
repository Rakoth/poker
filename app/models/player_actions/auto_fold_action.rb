class PlayerActions::AutoFoldAction < PlayerActions::FoldAction
  KIND = 0

	private
	
	def perform!
		player_influence
	end

end
