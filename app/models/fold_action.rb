class FoldAction < Action
  def kind
    return 0
  end

	protected
	
  def player_influence
    player.fold!
    super
  end
end
