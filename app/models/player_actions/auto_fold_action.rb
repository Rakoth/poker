class PlayerActions::AutoFoldAction < PlayerActions::FoldAction
	KIND = -2
	private
	
	def perform!
		player_influence
	end
end
