class PlayerActions::TimeoutCheckAction < PlayerActions::CheckAction
	KIND = -3

	protected

  def player_influence
		player.away_on_check!
		super
  end
end
