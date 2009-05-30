class PlayerActions::TimeoutFoldAction < PlayerActions::FoldAction
	KIND = -1

	protected

  def player_influence
		player.away_on_fold!
  end
end
