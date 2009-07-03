class PlayerActions::FoldAction < PlayerActions::Action

	def kind
		FOLD
	end

	protected
	
  def player_influence
    player.fold!
    super
  end
end
