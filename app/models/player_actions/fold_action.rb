class PlayerActions::FoldAction < PlayerActions::Action
  KIND = 0

	protected
	
  def player_influence
    player.fold!
    super
  end
end
