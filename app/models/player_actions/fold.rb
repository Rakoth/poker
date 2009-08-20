class PlayerActions::Fold < PlayerActions::Base
	def kind
		FOLD
	end

	protected
	
  def player_influence
    player.fold!
    super
  end
end
