class Actions::FoldAction < Action
  KIND = 0

	protected
	
  def player_influence
    player.fold!
    super
  end
end
