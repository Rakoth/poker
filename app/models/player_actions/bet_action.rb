class PlayerActions::BetAction < PlayerActions::Action

	def kind
		BET
	end

#	def after_initialize
#		self.value += player.for_call
#		super
#	end

	def has_value?
		true
	end

  def can_perform?
    return (value <= player.stack and game.minimal_bet <= value and game.current_bet == game.blind_size)
  end

  def game_influence
    game_params[:current_bet] = game.current_bet + value - player.for_call
    super
  end

  include StackAffectedAction
end
