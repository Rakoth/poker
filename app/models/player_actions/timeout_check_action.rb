class PlayerActions::TimeoutCheckAction < PlayerActions::CheckAction

	def kind
		TIMEOUT_CHECK
	end

	protected

  def player_influence
		player.away_on_check!
		super
  end
end
